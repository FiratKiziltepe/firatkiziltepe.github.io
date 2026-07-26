create extension if not exists pgcrypto;

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint,
  telegram_message_id bigint,
  title text not null default 'Başlıksız',
  original_text text not null default '',
  personal_note text not null default '',
  url text not null default '',
  summary text not null default '',
  category text not null default 'Genel',
  tags text[] not null default '{}',
  source text not null default 'web',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.saved_items
  add column if not exists telegram_user_id bigint,
  add column if not exists telegram_message_id bigint,
  add column if not exists title text not null default 'Başlıksız',
  add column if not exists original_text text not null default '',
  add column if not exists personal_note text not null default '',
  add column if not exists url text not null default '',
  add column if not exists summary text not null default '',
  add column if not exists category text not null default 'Genel',
  add column if not exists tags text[] not null default '{}',
  add column if not exists source text not null default 'web',
  add column if not exists is_favorite boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz;

create index if not exists saved_items_created_at_idx
  on public.saved_items (created_at desc);

create index if not exists saved_items_category_idx
  on public.saved_items (category);

create index if not exists saved_items_source_idx
  on public.saved_items (source);

create index if not exists saved_items_is_favorite_idx
  on public.saved_items (is_favorite);

create index if not exists saved_items_tags_gin_idx
  on public.saved_items using gin (tags);

create or replace function public.set_saved_items_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'saved_items_set_updated_at'
  ) then
    create trigger saved_items_set_updated_at
      before update on public.saved_items
      for each row
      execute function public.set_saved_items_updated_at();
  end if;
end $$;

create or replace function public.prevent_saved_items_telegram_duplicate()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.telegram_user_id is null or new.telegram_message_id is null then
    return new;
  end if;

  if exists (
    select 1
    from public.saved_items existing
    where existing.telegram_user_id = new.telegram_user_id
      and existing.telegram_message_id = new.telegram_message_id
      and existing.id is distinct from new.id
  ) then
    raise exception 'Telegram message already saved'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'saved_items_prevent_telegram_duplicate'
  ) then
    create trigger saved_items_prevent_telegram_duplicate
      before insert or update on public.saved_items
      for each row
      execute function public.prevent_saved_items_telegram_duplicate();
  end if;
end $$;

do $$
declare
  duplicate_count integer;
begin
  select count(*)
  into duplicate_count
  from (
    select telegram_user_id, telegram_message_id
    from public.saved_items
    where telegram_user_id is not null
      and telegram_message_id is not null
    group by telegram_user_id, telegram_message_id
    having count(*) > 1
  ) duplicates;

  if duplicate_count = 0 then
    create unique index if not exists saved_items_telegram_message_unique_idx
      on public.saved_items (telegram_user_id, telegram_message_id)
      where telegram_user_id is not null
        and telegram_message_id is not null;
  else
    raise notice 'Skipping saved_items_telegram_message_unique_idx because duplicate Telegram messages already exist.';
  end if;
end $$;

create or replace function public.search_saved_items(
  search_query text default '',
  category_filter text default '',
  source_filter text default '',
  favorites_only boolean default false
)
returns setof public.saved_items
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select
      nullif(btrim(coalesce(search_query, '')), '') as q,
      nullif(btrim(coalesce(category_filter, '')), '') as category_value,
      nullif(btrim(coalesce(source_filter, '')), '') as source_value,
      coalesce(favorites_only, false) as only_favorites
  )
  select saved_items.*
  from public.saved_items, params
  where (
      params.q is null
      or saved_items.title ilike '%' || params.q || '%'
      or saved_items.summary ilike '%' || params.q || '%'
      or saved_items.original_text ilike '%' || params.q || '%'
      or saved_items.personal_note ilike '%' || params.q || '%'
      or saved_items.category ilike '%' || params.q || '%'
      or exists (
        select 1
        from unnest(saved_items.tags) as tag
        where tag ilike '%' || params.q || '%'
      )
    )
    and (
      params.category_value is null
      or saved_items.category = params.category_value
    )
    and (
      params.source_value is null
      or saved_items.source = params.source_value
    )
    and (
      not params.only_favorites
      or saved_items.is_favorite is true
    )
  order by saved_items.created_at desc
  limit 500;
$$;

alter table public.saved_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_items'
      and policyname = 'saved_items_client_select_denied'
  ) then
    create policy saved_items_client_select_denied
      on public.saved_items
      for select
      to anon, authenticated
      using (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_items'
      and policyname = 'saved_items_client_insert_denied'
  ) then
    create policy saved_items_client_insert_denied
      on public.saved_items
      for insert
      to anon, authenticated
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_items'
      and policyname = 'saved_items_client_update_denied'
  ) then
    create policy saved_items_client_update_denied
      on public.saved_items
      for update
      to anon, authenticated
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_items'
      and policyname = 'saved_items_client_delete_denied'
  ) then
    create policy saved_items_client_delete_denied
      on public.saved_items
      for delete
      to anon, authenticated
      using (false);
  end if;
end $$;

revoke all on table public.saved_items from anon, authenticated;
revoke execute on function public.set_saved_items_updated_at()
  from public, anon, authenticated;
revoke execute on function public.prevent_saved_items_telegram_duplicate()
  from public, anon, authenticated;
revoke all on function public.search_saved_items(text, text, text, boolean)
  from public, anon, authenticated;

grant all on table public.saved_items to service_role;
grant execute on function public.search_saved_items(text, text, text, boolean)
  to service_role;
