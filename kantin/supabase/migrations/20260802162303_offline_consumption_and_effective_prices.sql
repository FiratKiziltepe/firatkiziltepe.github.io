-- Every browser-originated consumption receives a stable idempotency key.
-- This lets offline clients safely retry an ambiguous request without creating
-- duplicate account entries.
alter table public.consumption_entries
  add column client_mutation_id uuid not null default gen_random_uuid();

create unique index consumption_client_mutation_id_unique_idx
  on public.consumption_entries (client_mutation_id);

comment on column public.consumption_entries.client_mutation_id is
  'Client-generated idempotency key used by the offline consumption outbox.';

-- A customer may enter consumption for the previous two calendar days. Make
-- the first price of a newly-added catalog item cover the same window so a
-- product entered into the catalog today can still be used for an eligible
-- backdated consumption.
update public.product_price_history ph
set effective_on = ((p.created_at at time zone 'Europe/Istanbul')::date - 2)
from public.products p
where p.id = ph.product_id
  and ph.effective_on = (p.created_at at time zone 'Europe/Istanbul')::date
  and not exists (
    select 1
    from public.product_price_history older
    where older.product_id = ph.product_id
      and older.effective_on < ph.effective_on
  );

create or replace function private.sync_product_price_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_effective_on date;
begin
  if tg_op = 'INSERT' then
    v_effective_on := private.local_today() - 2;
  elsif new.current_price is distinct from old.current_price then
    v_effective_on := private.local_today();
  else
    return new;
  end if;

  insert into public.product_price_history (product_id, price, effective_on, changed_by)
  values (new.id, new.current_price, v_effective_on, coalesce(new.updated_by, new.created_by))
  on conflict (product_id, effective_on)
  do update set
    price = excluded.price,
    changed_by = excluded.changed_by,
    created_at = now();

  return new;
end;
$$;

-- Historical prices are required to render the same date-specific amount that
-- the insert trigger will use. Expose only the three non-sensitive columns;
-- actor/audit metadata remains inaccessible through the Data API.
drop policy if exists price_history_authenticated_deny_policy
  on public.product_price_history;

create policy price_history_authenticated_select_policy
on public.product_price_history
for select
to authenticated
using (
  private.is_active_user()
  and exists (
    select 1
    from public.products p
    join public.categories c on c.id = p.category_id
    where p.id = product_price_history.product_id
      and (private.is_canteen() or (p.is_active and c.is_active))
  )
);

grant select (product_id, price, effective_on)
on public.product_price_history
to authenticated;

-- Check for an already-accepted mutation before running the insert trigger.
-- This is important because a retry may arrive after the week was marked paid;
-- an operation that was already committed must still be acknowledged as a
-- success. SECURITY INVOKER keeps the existing RLS policies in force.
create or replace function public.add_consumption_idempotent(
  p_client_mutation_id uuid,
  p_customer_id uuid,
  p_product_id bigint,
  p_quantity smallint,
  p_consumed_on date
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_entry_id bigint;
begin
  select id
  into v_entry_id
  from public.consumption_entries
  where client_mutation_id = p_client_mutation_id;

  if v_entry_id is not null then
    return v_entry_id;
  end if;

  begin
    insert into public.consumption_entries (
      client_mutation_id,
      customer_id,
      product_id,
      quantity,
      consumed_on
    )
    values (
      p_client_mutation_id,
      p_customer_id,
      p_product_id,
      p_quantity,
      p_consumed_on
    )
    returning id into v_entry_id;
  exception
    when unique_violation then
      select id
      into v_entry_id
      from public.consumption_entries
      where client_mutation_id = p_client_mutation_id;

      if v_entry_id is null then
        raise;
      end if;
  end;

  return v_entry_id;
end;
$$;

revoke execute on function public.add_consumption_idempotent(uuid, uuid, bigint, smallint, date)
from public, anon;

grant execute on function public.add_consumption_idempotent(uuid, uuid, bigint, smallint, date)
to authenticated;
