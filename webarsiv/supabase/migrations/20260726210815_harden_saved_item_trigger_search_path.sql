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

revoke execute on function public.set_saved_items_updated_at()
  from public, anon, authenticated;
revoke execute on function public.prevent_saved_items_telegram_duplicate()
  from public, anon, authenticated;
