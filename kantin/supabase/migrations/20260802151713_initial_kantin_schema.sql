create schema if not exists private;
revoke all on schema private from public, anon;

create type public.app_role as enum ('customer', 'canteen');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role public.app_role not null default 'customer',
  is_manager boolean not null default false,
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  constraint profiles_display_name_length check (char_length(trim(display_name)) between 2 and 80),
  constraint profiles_manager_role check (not is_manager or role = 'canteen')
);

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(trim(name)) between 2 and 60)
);

create unique index categories_name_unique_idx on public.categories (lower(name));

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories(id) on delete restrict,
  name text not null,
  current_price numeric(10,2) not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_length check (char_length(trim(name)) between 2 and 80),
  constraint products_price_positive check (current_price > 0 and current_price <= 999999.99)
);

create unique index products_name_unique_idx on public.products (lower(name));
create index products_category_id_idx on public.products (category_id);
create index products_active_category_idx on public.products (category_id, name) where is_active;

create table public.product_price_history (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  price numeric(10,2) not null,
  effective_on date not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint product_price_history_price_positive check (price > 0 and price <= 999999.99),
  constraint product_price_history_product_date_unique unique (product_id, effective_on)
);

create index product_price_history_lookup_idx
  on public.product_price_history (product_id, effective_on desc);

create table public.consumption_entries (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  product_id bigint not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  category_name_snapshot text not null,
  quantity smallint not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(12,2) generated always as (quantity::numeric * unit_price) stored,
  consumed_on date not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  last_edit_reason text,
  revision_count integer not null default 0,
  is_cancelled boolean not null default false,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete restrict,
  cancellation_reason text,
  constraint consumption_quantity_valid check (quantity between 1 and 99),
  constraint consumption_unit_price_valid check (unit_price > 0 and unit_price <= 999999.99),
  constraint consumption_weekday_only check (extract(isodow from consumed_on) between 1 and 5),
  constraint consumption_revision_count_valid check (revision_count >= 0),
  constraint consumption_cancel_fields check (
    (not is_cancelled and cancelled_at is null and cancelled_by is null and cancellation_reason is null)
    or
    (is_cancelled and cancelled_at is not null and cancelled_by is not null and char_length(trim(cancellation_reason)) >= 3)
  )
);

create index consumption_customer_date_idx
  on public.consumption_entries (customer_id, consumed_on desc);
create index consumption_product_id_idx on public.consumption_entries (product_id);
create index consumption_created_by_idx on public.consumption_entries (created_by);
create index consumption_open_customer_date_idx
  on public.consumption_entries (customer_id, consumed_on desc)
  where not is_cancelled;

create table public.consumption_revisions (
  id bigint generated always as identity primary key,
  entry_id bigint not null references public.consumption_entries(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  old_data jsonb not null,
  new_data jsonb not null,
  changed_at timestamptz not null default now(),
  constraint consumption_revisions_reason_length check (char_length(trim(reason)) between 3 and 500)
);

create index consumption_revisions_entry_id_idx on public.consumption_revisions (entry_id, changed_at desc);
create index consumption_revisions_customer_id_idx on public.consumption_revisions (customer_id, changed_at desc);
create index consumption_revisions_changed_by_idx on public.consumption_revisions (changed_by);

create table public.weekly_accounts (
  customer_id uuid not null references public.profiles(id) on delete restrict,
  week_start date not null,
  is_paid boolean not null default false,
  total_snapshot numeric(12,2),
  marked_paid_by uuid references public.profiles(id) on delete restrict,
  marked_paid_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (customer_id, week_start),
  constraint weekly_accounts_monday_start check (extract(isodow from week_start) = 1),
  constraint weekly_accounts_paid_fields check (
    (not is_paid and total_snapshot is null and marked_paid_by is null and marked_paid_at is null)
    or
    (is_paid and total_snapshot is not null and marked_paid_by is not null and marked_paid_at is not null)
  )
);

create index weekly_accounts_paid_week_idx on public.weekly_accounts (is_paid, week_start desc);
create index weekly_accounts_marked_paid_by_idx on public.weekly_accounts (marked_paid_by);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_action_length check (char_length(action) between 2 and 80),
  constraint audit_entity_type_length check (char_length(entity_type) between 2 and 80)
);

create index audit_events_actor_id_idx on public.audit_events (actor_id, created_at desc);
create index audit_events_created_at_idx on public.audit_events (created_at desc);

create or replace function private.local_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Istanbul')::date;
$$;

create or replace function private.week_start(p_date date)
returns date
language sql
immutable
strict
set search_path = ''
as $$
  select p_date - (extract(isodow from p_date)::integer - 1);
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_active
  );
$$;

create or replace function private.is_canteen()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'canteen'
      and is_active
  );
$$;

create or replace function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'canteen'
      and is_manager
      and is_active
  );
$$;

create or replace function private.prepare_category()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not private.is_canteen() then
    raise exception 'Bu işlem için aktif kantinci yetkisi gerekir.';
  end if;

  new.name := trim(new.name);
  new.updated_by := v_actor;
  new.updated_at := now();

  if tg_op = 'INSERT' then
    new.created_by := v_actor;
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create or replace function private.prepare_product()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not private.is_canteen() then
    raise exception 'Bu işlem için aktif kantinci yetkisi gerekir.';
  end if;

  if not exists (select 1 from public.categories where id = new.category_id and is_active) then
    raise exception 'Aktif kategori bulunamadı.';
  end if;

  new.name := trim(new.name);
  new.updated_by := v_actor;
  new.updated_at := now();

  if tg_op = 'INSERT' then
    new.created_by := v_actor;
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create or replace function private.sync_product_price_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.current_price is distinct from old.current_price then
    insert into public.product_price_history (product_id, price, effective_on, changed_by)
    values (new.id, new.current_price, private.local_today(), coalesce(new.updated_by, new.created_by))
    on conflict (product_id, effective_on)
    do update set
      price = excluded.price,
      changed_by = excluded.changed_by,
      created_at = now();
  end if;
  return new;
end;
$$;

create or replace function private.prepare_consumption_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_role public.app_role;
  v_price numeric(10,2);
begin
  select role into v_role
  from public.profiles
  where id = v_actor and is_active;

  if v_role is null then raise exception 'Aktif kullanıcı bulunamadı.'; end if;
  if not exists (select 1 from public.profiles where id = new.customer_id and role = 'customer' and is_active) then
    raise exception 'Aktif müşteri bulunamadı.';
  end if;
  if v_role = 'customer' and new.customer_id <> v_actor then
    raise exception 'Yalnızca kendi hesabınıza kayıt ekleyebilirsiniz.';
  end if;
  if new.consumed_on > private.local_today() then raise exception 'Gelecek tarihli kayıt eklenemez.'; end if;
  if extract(isodow from new.consumed_on) not between 1 and 5 then
    raise exception 'Yalnızca pazartesi-cuma günleri kayıt eklenebilir.';
  end if;
  if v_role = 'customer' and new.consumed_on < private.local_today() - 2 then
    raise exception 'Müşteriler en fazla iki gün geriye kayıt ekleyebilir.';
  end if;
  if exists (
    select 1 from public.weekly_accounts
    where customer_id = new.customer_id
      and week_start = private.week_start(new.consumed_on)
      and is_paid
  ) then
    raise exception 'Ödenmiş hafta değiştirilemez.';
  end if;

  select ph.price, p.name, c.name
    into v_price, new.product_name_snapshot, new.category_name_snapshot
  from public.products p
  join public.categories c on c.id = p.category_id
  join lateral (
    select price
    from public.product_price_history
    where product_id = p.id and effective_on <= new.consumed_on
    order by effective_on desc
    limit 1
  ) ph on true
  where p.id = new.product_id and p.is_active and c.is_active;

  if v_price is null then raise exception 'Bu tarih için aktif ürün fiyatı bulunamadı.'; end if;

  new.unit_price := v_price;
  new.created_by := v_actor;
  new.created_at := now();
  new.updated_by := null;
  new.updated_at := now();
  new.revision_count := 0;
  new.last_edit_reason := null;
  new.is_cancelled := false;
  new.cancelled_at := null;
  new.cancelled_by := null;
  new.cancellation_reason := null;
  return new;
end;
$$;

create or replace function private.prepare_consumption_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_role public.app_role;
  v_price numeric(10,2);
begin
  select role into v_role from public.profiles where id = v_actor and is_active;
  if v_role is null then raise exception 'Aktif kullanıcı bulunamadı.'; end if;
  if v_role = 'customer' and old.customer_id <> v_actor then
    raise exception 'Yalnızca kendi kayıtlarınızı değiştirebilirsiniz.';
  end if;
  if exists (
    select 1 from public.weekly_accounts
    where customer_id = old.customer_id
      and week_start in (private.week_start(old.consumed_on), private.week_start(new.consumed_on))
      and is_paid
  ) then
    raise exception 'Ödenmiş hafta değiştirilemez.';
  end if;
  if v_role = 'customer' and (old.consumed_on < private.local_today() - 2 or new.consumed_on < private.local_today() - 2) then
    raise exception 'Müşteriler yalnızca son iki günün kayıtlarını değiştirebilir.';
  end if;
  if new.consumed_on > private.local_today() then raise exception 'Gelecek tarihli kayıt girilemez.'; end if;
  if extract(isodow from new.consumed_on) not between 1 and 5 then
    raise exception 'Yalnızca pazartesi-cuma günleri kayıt girilebilir.';
  end if;
  if new.customer_id is distinct from old.customer_id then raise exception 'Kayıt sahibi değiştirilemez.'; end if;
  if new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Kayıt oluşturan bilgisi değiştirilemez.';
  end if;
  if char_length(trim(coalesce(new.last_edit_reason, ''))) < 3 then
    raise exception 'Değişiklik için en az 3 karakterlik gerekçe gerekir.';
  end if;
  if row(new.product_id, new.quantity, new.consumed_on, new.is_cancelled)
     is not distinct from row(old.product_id, old.quantity, old.consumed_on, old.is_cancelled) then
    raise exception 'Kayda ait değişen bir alan bulunamadı.';
  end if;
  if old.is_cancelled and not new.is_cancelled and v_role <> 'canteen' then
    raise exception 'İptal edilmiş kaydı yalnızca kantinci yeniden açabilir.';
  end if;

  select ph.price, p.name, c.name
    into v_price, new.product_name_snapshot, new.category_name_snapshot
  from public.products p
  join public.categories c on c.id = p.category_id
  join lateral (
    select price
    from public.product_price_history
    where product_id = p.id and effective_on <= new.consumed_on
    order by effective_on desc
    limit 1
  ) ph on true
  where p.id = new.product_id;

  if v_price is null then raise exception 'Bu tarih için ürün fiyatı bulunamadı.'; end if;
  new.unit_price := v_price;
  new.updated_by := v_actor;
  new.updated_at := now();
  new.revision_count := old.revision_count + 1;
  new.last_edit_reason := trim(new.last_edit_reason);

  if new.is_cancelled and not old.is_cancelled then
    new.cancelled_at := now();
    new.cancelled_by := v_actor;
    new.cancellation_reason := new.last_edit_reason;
  elsif not new.is_cancelled and old.is_cancelled then
    new.cancelled_at := null;
    new.cancelled_by := null;
    new.cancellation_reason := null;
  else
    new.cancelled_at := old.cancelled_at;
    new.cancelled_by := old.cancelled_by;
    new.cancellation_reason := old.cancellation_reason;
  end if;
  return new;
end;
$$;

create or replace function private.log_consumption_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.consumption_revisions (
    entry_id, customer_id, changed_by, reason, old_data, new_data
  ) values (
    new.id,
    new.customer_id,
    new.updated_by,
    new.last_edit_reason,
    jsonb_build_object(
      'product_id', old.product_id,
      'product_name', old.product_name_snapshot,
      'quantity', old.quantity,
      'unit_price', old.unit_price,
      'total_price', old.total_price,
      'consumed_on', old.consumed_on,
      'is_cancelled', old.is_cancelled
    ),
    jsonb_build_object(
      'product_id', new.product_id,
      'product_name', new.product_name_snapshot,
      'quantity', new.quantity,
      'unit_price', new.unit_price,
      'total_price', new.total_price,
      'consumed_on', new.consumed_on,
      'is_cancelled', new.is_cancelled
    )
  );
  return new;
end;
$$;

create or replace function private.prepare_weekly_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not private.is_canteen() then
    raise exception 'Bu işlem için aktif kantinci yetkisi gerekir.';
  end if;
  if not exists (select 1 from public.profiles where id = new.customer_id and role = 'customer') then
    raise exception 'Müşteri hesabı bulunamadı.';
  end if;
  if extract(isodow from new.week_start) <> 1 then raise exception 'Hafta pazartesi günü başlamalıdır.'; end if;
  if new.week_start > private.week_start(private.local_today()) then raise exception 'Gelecek hafta kapatılamaz.'; end if;

  if new.is_paid then
    select coalesce(sum(total_price) filter (where not is_cancelled), 0)
      into new.total_snapshot
    from public.consumption_entries
    where customer_id = new.customer_id
      and consumed_on between new.week_start and new.week_start + 4;
    new.marked_paid_by := v_actor;
    new.marked_paid_at := now();
  else
    new.total_snapshot := null;
    new.marked_paid_by := null;
    new.marked_paid_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger categories_prepare_trigger
before insert or update on public.categories
for each row execute function private.prepare_category();

create trigger products_prepare_trigger
before insert or update on public.products
for each row execute function private.prepare_product();

create trigger products_price_history_trigger
after insert or update of current_price on public.products
for each row execute function private.sync_product_price_history();

create trigger consumption_prepare_insert_trigger
before insert on public.consumption_entries
for each row execute function private.prepare_consumption_insert();

create trigger consumption_prepare_update_trigger
before update on public.consumption_entries
for each row execute function private.prepare_consumption_update();

create trigger consumption_revision_trigger
after update on public.consumption_entries
for each row execute function private.log_consumption_revision();

create trigger weekly_account_prepare_trigger
before insert or update on public.weekly_accounts
for each row execute function private.prepare_weekly_account();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_price_history enable row level security;
alter table public.consumption_entries enable row level security;
alter table public.consumption_revisions enable row level security;
alter table public.weekly_accounts enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_policy on public.profiles
for select to authenticated
using (
  private.is_active_user()
  and (id = (select auth.uid()) or private.is_canteen())
);

create policy categories_customer_select_policy on public.categories
for select to authenticated
using (private.is_active_user() and (is_active or private.is_canteen()));
create policy categories_canteen_insert_policy on public.categories
for insert to authenticated with check (private.is_canteen());
create policy categories_canteen_update_policy on public.categories
for update to authenticated using (private.is_canteen()) with check (private.is_canteen());

create policy products_customer_select_policy on public.products
for select to authenticated
using (
  private.is_active_user()
  and (
    private.is_canteen()
    or (
      is_active
      and exists (
        select 1
        from public.categories
        where categories.id = products.category_id
          and categories.is_active
      )
    )
  )
);
create policy products_canteen_insert_policy on public.products
for insert to authenticated with check (private.is_canteen());
create policy products_canteen_update_policy on public.products
for update to authenticated using (private.is_canteen()) with check (private.is_canteen());

create policy consumption_select_policy on public.consumption_entries
for select to authenticated
using (private.is_active_user() and (customer_id = (select auth.uid()) or private.is_canteen()));
create policy consumption_insert_policy on public.consumption_entries
for insert to authenticated
with check (private.is_active_user() and (customer_id = (select auth.uid()) or private.is_canteen()));
create policy consumption_update_policy on public.consumption_entries
for update to authenticated
using (private.is_active_user() and (customer_id = (select auth.uid()) or private.is_canteen()))
with check (private.is_active_user() and (customer_id = (select auth.uid()) or private.is_canteen()));

create policy revisions_select_policy on public.consumption_revisions
for select to authenticated
using (private.is_active_user() and (customer_id = (select auth.uid()) or private.is_canteen()));

create policy weekly_accounts_select_policy on public.weekly_accounts
for select to authenticated
using (private.is_active_user() and (customer_id = (select auth.uid()) or private.is_canteen()));
create policy weekly_accounts_canteen_insert_policy on public.weekly_accounts
for insert to authenticated with check (private.is_canteen());
create policy weekly_accounts_canteen_update_policy on public.weekly_accounts
for update to authenticated using (private.is_canteen()) with check (private.is_canteen());

create policy audit_events_canteen_select_policy on public.audit_events
for select to authenticated
using (private.is_canteen());

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.is_canteen() to authenticated;
grant execute on function private.is_manager() to authenticated;

grant select on public.profiles, public.categories, public.products,
  public.consumption_entries, public.consumption_revisions,
  public.weekly_accounts, public.audit_events
to authenticated;

grant insert, update on public.categories, public.products,
  public.consumption_entries, public.weekly_accounts
to authenticated;

grant usage, select on sequence public.categories_id_seq,
  public.products_id_seq, public.consumption_entries_id_seq
to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

revoke execute on all functions in schema private from public, anon;
revoke execute on function private.prepare_category() from authenticated;
revoke execute on function private.prepare_product() from authenticated;
revoke execute on function private.sync_product_price_history() from authenticated;
revoke execute on function private.prepare_consumption_insert() from authenticated;
revoke execute on function private.prepare_consumption_update() from authenticated;
revoke execute on function private.log_consumption_revision() from authenticated;
revoke execute on function private.prepare_weekly_account() from authenticated;
