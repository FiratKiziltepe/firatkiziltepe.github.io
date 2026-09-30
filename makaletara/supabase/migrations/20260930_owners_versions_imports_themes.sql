-- ============================================================
-- v15 — project owners, AI result versions, imports, thematic analysis
-- Additive only: no column or row is dropped or rewritten.
-- ============================================================

-- 0. Safety copy of every table as it was before this migration
--    (schema not exposed through the API; drop it once you are satisfied)
create schema if not exists backup_20260930;
revoke all on schema backup_20260930 from public, anon, authenticated;
create table backup_20260930.profiles        as table public.profiles;
create table backup_20260930.projects        as table public.projects;
create table backup_20260930.project_members as table public.project_members;
create table backup_20260930.records         as table public.records;
create table backup_20260930.votes           as table public.votes;
create table backup_20260930.project_terms   as table public.project_terms;

-- 1. Project owners: every registered user may create projects and manage
--    the members of the projects they own. Admins keep full access.
create or replace function private.is_owner(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects where id = pid and owner_id = (select auth.uid()));
$$;

create or replace function private.is_member(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin()
      or exists (select 1 from public.projects where id = pid and owner_id = (select auth.uid()))
      or exists (select 1 from public.project_members where project_id = pid and user_id = (select auth.uid()));
$$;

-- the owner sees every vote of their project, also in blind mode (like the admin)
create or replace function private.can_see_votes(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin()
      or exists (select 1 from public.projects where id = pid and owner_id = (select auth.uid()))
      or (exists (select 1 from public.project_members where project_id = pid and user_id = (select auth.uid()))
          and not coalesce((select blind from public.projects where id = pid), true));
$$;

create or replace function private.can_see_profile(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select uid = (select auth.uid())
      or private.is_admin()
      or exists (select 1 from public.profiles where id = uid and role = 'admin')
      or exists (select 1 from public.project_members a
                 join public.project_members b on a.project_id = b.project_id
                 where a.user_id = (select auth.uid()) and b.user_id = uid)
      or exists (select 1 from public.projects p join public.project_members m on m.project_id = p.id
                 where (p.owner_id = (select auth.uid()) and m.user_id = uid)
                    or (m.user_id = (select auth.uid()) and p.owner_id = uid));
$$;

revoke execute on function private.is_owner(uuid) from public, anon;
grant execute on function private.is_owner(uuid) to authenticated;

drop policy projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));
drop policy projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated
  using (private.is_admin() or owner_id = (select auth.uid()));

drop policy members_insert on public.project_members;
create policy members_insert on public.project_members for insert to authenticated
  with check (private.is_admin() or private.is_owner(project_id));
drop policy members_delete on public.project_members;
create policy members_delete on public.project_members for delete to authenticated
  using (private.is_admin() or private.is_owner(project_id) or user_id = (select auth.uid()));

drop policy records_delete on public.records;
create policy records_delete on public.records for delete to authenticated
  using (private.is_admin() or private.is_owner(project_id));

-- Owners add people by exact e-mail; the list of all users is never exposed.
create or replace function public.add_member_by_email(pid uuid, member_email text)
returns json language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  if not (private.is_admin() or private.is_owner(pid)) then
    raise exception 'Bu projeye üye eklemeye yetkiniz yok.';
  end if;
  select * into p from public.profiles where email = lower(trim(member_email));
  if p.id is null then
    raise exception 'Bu e-postayla kayıtlı kullanıcı yok. Kişi önce "Kayıt ol" ile hesap açmalı.';
  end if;
  insert into public.project_members (project_id, user_id) values (pid, p.id) on conflict do nothing;
  return json_build_object('id', p.id, 'email', p.email, 'display_name', p.display_name, 'role', p.role);
end $$;
revoke execute on function public.add_member_by_email(uuid, text) from public, anon;
grant execute on function public.add_member_by_email(uuid, text) to authenticated;

-- 2. Imports: which file / database a record came from (PRISMA identification)
alter table public.records add column if not exists source_label text not null default '';
alter table public.records add column if not exists import_id text not null default '';

-- 3. Thematic analysis (separate from screening)
alter table public.projects add column if not exists themes jsonb not null default '{}'::jsonb;
alter table public.records add column if not exists theme jsonb;                              -- AI result
alter table public.records add column if not exists theme_final text[] not null default '{}'; -- confirmed by a person
alter table public.records add column if not exists theme_by uuid references public.profiles(id) on delete set null;
create index if not exists records_theme_by_idx on public.records(theme_by);

-- 4. AI result versions: one row per record and protocol version (prompt hash).
--    records.ai stays the active version; nothing here changes it.
create table if not exists public.record_ai_versions (
  project_id uuid not null references public.projects(id) on delete cascade,
  rid text not null,
  version text not null,
  ai jsonb,
  ai_decision text,
  created_at timestamptz not null default now(),
  primary key (project_id, rid, version)
);
create index if not exists record_ai_versions_version_idx on public.record_ai_versions(project_id, version);
alter table public.record_ai_versions enable row level security;
create policy versions_select on public.record_ai_versions for select to authenticated using (private.is_member(project_id));
create policy versions_insert on public.record_ai_versions for insert to authenticated with check (private.is_member(project_id));
create policy versions_update on public.record_ai_versions for update to authenticated
  using (private.is_member(project_id)) with check (private.is_member(project_id));
create policy versions_delete on public.record_ai_versions for delete to authenticated
  using (private.is_admin() or private.is_owner(project_id));
revoke all on public.record_ai_versions from anon;

-- existing AI results become the first version of each project
insert into public.record_ai_versions (project_id, rid, version, ai, ai_decision, created_at)
select r.project_id, r.rid,
       coalesce(nullif(r.ai->>'promptHash', ''), nullif(p.protocol->>'promptHash', ''), 'v1'),
       r.ai, r.ai_decision, r.updated_at
from public.records r join public.projects p on p.id = r.project_id
where r.ai is not null
on conflict do nothing;

-- 5. Project overview: owner information
drop function if exists public.project_overview();
create function public.project_overview()
returns table (id uuid, name text, description text, blind boolean, hide_ai boolean, file_name text,
               created_at timestamptz, updated_at timestamptz, total integer, removed integer,
               my_votes integer, members integer, archived integer,
               owner_id uuid, is_owner boolean, owner_name text)
language sql stable security invoker set search_path = '' as $$
  select p.id, p.name, p.description, p.blind, p.hide_ai, p.file_name, p.created_at, p.updated_at,
    (select count(*) from public.records r where r.project_id = p.id and not r.removed and not r.archived)::int,
    (select count(*) from public.records r where r.project_id = p.id and r.removed)::int,
    (select count(*) from public.votes v join public.records r on r.id = v.record_id
      where v.project_id = p.id and v.user_id = (select auth.uid()) and v.decision is not null and not r.removed and not r.archived)::int,
    (select count(*) from public.project_members m where m.project_id = p.id)::int,
    (select count(*) from public.records r where r.project_id = p.id and r.archived)::int,
    p.owner_id,
    p.owner_id = (select auth.uid()),
    coalesce((select nullif(pr.display_name, '') from public.profiles pr where pr.id = p.owner_id), '')
  from public.projects p
  order by p.updated_at desc;
$$;
grant execute on function public.project_overview() to authenticated;
