-- ============================================================
-- Literatür Tarama — collaborative screening schema (Supabase)
-- Applied to project "makaletara" (mgrjdyfjstmpvedunipb) as the
-- migrations screening_schema, move_helpers_to_private, members_can_curate and records_archive.
-- Run this file once on an empty project to recreate everything.
--
-- Roles
--   admin    : creates/deletes projects, manages members, sees every project
--   reviewer : sees only projects shared with them; inside those projects
--              works like the admin (final decisions, duplicates, re-analysis,
--              project settings) and changes only their own vote
-- Blind mode : reviewers see only their own votes (enforced by RLS,
--              also for realtime)
-- Make someone admin:  insert into public.admin_emails values ('x@y.com');
--   (applies at sign-up) or, for an existing account:
--   update public.profiles set role = 'admin' where email = 'x@y.com';
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'reviewer' check (role in ('admin', 'reviewer')),
  created_at timestamptz not null default now()
);

-- e-mails that become admin on sign-up (RLS on, no policies: not reachable through the API)
create table public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null default auth.uid() references public.profiles(id),
  blind boolean not null default true,
  hide_ai boolean not null default false,
  protocol jsonb not null default '{}'::jsonb,
  file_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_owner_idx on public.projects(owner_id);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_members_user_idx on public.project_members(user_id);

create table public.records (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  rid text not null,
  ord integer not null default 0,
  source_id text not null default '',
  source_row integer,
  title text not null default '',
  abstract text not null default '',
  authors text not null default '',
  year text not null default '',
  doi text not null default '',
  keywords text not null default '',
  doctype text not null default '',
  no_abstract boolean not null default false,
  duplicate_of text,
  dup_kind text,
  dup_score real,
  not_dup_of text[] not null default '{}',
  removed boolean not null default false,
  removed_reason text not null default '',
  archived boolean not null default false,          -- out of the working list and counts, restorable
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  ai jsonb,
  ai_decision text,
  final_decision text check (final_decision in ('Include', 'Exclude', 'Uncertain')),
  final_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (project_id, rid)
);
create index records_project_ord_idx on public.records(project_id, ord);
create index records_final_by_idx on public.records(final_by);
create index records_archived_by_idx on public.records(archived_by);

create table public.votes (
  record_id bigint not null references public.records(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  decision text check (decision in ('Include', 'Exclude', 'Uncertain')),
  labels text[] not null default '{}',
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (record_id, user_id)
);
create index votes_project_idx on public.votes(project_id);
create index votes_user_idx on public.votes(user_id);

-- ------------------------------------------------------------
-- Helpers live in a schema that PostgREST does not expose
-- ------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create or replace function private.is_member(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin()
      or exists (select 1 from public.project_members where project_id = pid and user_id = (select auth.uid()));
$$;

create or replace function private.can_see_votes(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin()
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
                 where a.user_id = (select auth.uid()) and b.user_id = uid);
$$;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1)),
    case when exists (select 1 from public.admin_emails a where a.email = lower(new.email)) then 'admin' else 'reviewer' end
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger projects_touch before update on public.projects for each row execute function private.touch_updated_at();
create trigger records_touch before update on public.records for each row execute function private.touch_updated_at();

-- votes.project_id always follows the record (cannot be spoofed)
create or replace function private.votes_fill() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.project_id := (select project_id from public.records where id = new.record_id);
  if new.project_id is null then raise exception 'record not found'; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger votes_fill before insert or update on public.votes for each row execute function private.votes_fill();

revoke execute on all functions in schema private from public, anon;
grant execute on function private.is_admin(), private.is_member(uuid), private.can_see_votes(uuid), private.can_see_profile(uuid) to authenticated;

-- ------------------------------------------------------------
-- Row level security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.records enable row level security;
alter table public.votes enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (private.can_see_profile(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy projects_select on public.projects for select to authenticated using (private.is_member(id));
create policy projects_insert on public.projects for insert to authenticated with check (private.is_admin());
create policy projects_update on public.projects for update to authenticated using (private.is_member(id)) with check (private.is_member(id));
create policy projects_delete on public.projects for delete to authenticated using (private.is_admin());

create policy members_select on public.project_members for select to authenticated using (private.is_member(project_id));
create policy members_insert on public.project_members for insert to authenticated with check (private.is_admin());
create policy members_delete on public.project_members for delete to authenticated using (private.is_admin());

create policy records_select on public.records for select to authenticated using (private.is_member(project_id));
create policy records_insert on public.records for insert to authenticated with check (private.is_member(project_id));
create policy records_update on public.records for update to authenticated using (private.is_member(project_id)) with check (private.is_member(project_id));
create policy records_delete on public.records for delete to authenticated using (private.is_admin());

create policy votes_select on public.votes for select to authenticated
  using (user_id = (select auth.uid()) or private.can_see_votes(project_id));
create policy votes_insert on public.votes for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_member(project_id));
create policy votes_update on public.votes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and private.is_member(project_id));
create policy votes_delete on public.votes for delete to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

revoke all on public.profiles, public.projects, public.project_members, public.records, public.votes, public.admin_emails from anon;
revoke all on public.admin_emails from authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

-- ------------------------------------------------------------
-- Project overview (security invoker: RLS applies)
-- ------------------------------------------------------------
create or replace function public.project_overview()
returns table (id uuid, name text, description text, blind boolean, hide_ai boolean, file_name text,
               created_at timestamptz, updated_at timestamptz, total integer, removed integer,
               my_votes integer, members integer, archived integer)
language sql stable security invoker set search_path = '' as $$
  select p.id, p.name, p.description, p.blind, p.hide_ai, p.file_name, p.created_at, p.updated_at,
    (select count(*) from public.records r where r.project_id = p.id and not r.removed and not r.archived)::int,
    (select count(*) from public.records r where r.project_id = p.id and r.removed)::int,
    (select count(*) from public.votes v join public.records r on r.id = v.record_id
      where v.project_id = p.id and v.user_id = (select auth.uid()) and v.decision is not null and not r.removed and not r.archived)::int,
    (select count(*) from public.project_members m where m.project_id = p.id)::int,
    (select count(*) from public.records r where r.project_id = p.id and r.archived)::int
  from public.projects p
  order by p.updated_at desc;
$$;
grant execute on function public.project_overview() to authenticated;

-- a reviewer must not be able to hand a project to someone else
create or replace function private.projects_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id and not private.is_admin() then
    raise exception 'only an admin can change the project owner';
  end if;
  return new;
end $$;
create trigger projects_guard before update on public.projects for each row execute function private.projects_guard();
revoke execute on function private.projects_guard() from public, anon, authenticated;

-- live updates of votes and records (RLS applies to realtime too)
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.records;

-- delta sync ("what changed since t")
create index votes_project_updated_idx on public.votes(project_id, updated_at);
create index records_project_updated_idx on public.records(project_id, updated_at);
