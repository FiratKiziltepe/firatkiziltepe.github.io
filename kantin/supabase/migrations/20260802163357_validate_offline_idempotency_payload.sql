-- Reject accidental or malicious reuse of an idempotency key with another payload.
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
  where client_mutation_id = p_client_mutation_id
    and customer_id = p_customer_id
    and product_id = p_product_id
    and quantity = p_quantity
    and consumed_on = p_consumed_on;

  if v_entry_id is not null then
    return v_entry_id;
  end if;

  if exists (
    select 1
    from public.consumption_entries
    where client_mutation_id = p_client_mutation_id
  ) then
    raise exception 'İşlem kimliği farklı bir tüketim kaydında kullanılmış.'
      using errcode = '23505';
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
      where client_mutation_id = p_client_mutation_id
        and customer_id = p_customer_id
        and product_id = p_product_id
        and quantity = p_quantity
        and consumed_on = p_consumed_on;

      if v_entry_id is null then
        raise;
      end if;
  end;

  return v_entry_id;
end;
$$;
