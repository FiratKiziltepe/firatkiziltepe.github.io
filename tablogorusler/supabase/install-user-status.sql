-- Supabase SQL Editor'da postgres rolüyle tamamını bir kez çalıştırın.
-- Kurulum hiçbir hesabın durumunu değiştirmez. Tekrar çalıştırılabilir.
begin;

create schema if not exists tablogorusler_private;
revoke all on schema tablogorusler_private from public, anon;
grant usage on schema tablogorusler_private to authenticated;

create or replace function tablogorusler_private.manage_user_status(
  p_action text, p_active boolean default null, p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  result jsonb;
  affected integer;
begin
  if actor is null then
    raise exception 'Oturum gerekli. Tekrar giriş yapın.' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('list', 'set') then
    raise exception 'Geçersiz işlem.' using errcode = '22023';
  end if;
  -- İki adminin eşzamanlı toplu işlemle birbirini pasifleştirmesini önle.
  if p_action = 'set' then
    perform pg_catalog.pg_advisory_xact_lock(205112, 1);
  end if;
  if not exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = actor and p.rol = 'admin'
      and (u.banned_until is null or u.banned_until <= now())
  ) then
    raise exception 'Bu işlem yalnızca aktif admin hesabına açıktır.' using errcode = '42501';
  end if;

  if p_action = 'list' then
    select coalesce(jsonb_object_agg(u.id::text,
      u.banned_until is null or u.banned_until <= now()), '{}'::jsonb)
    into result
    from auth.users u
    where exists (select 1 from public.profiles p where p.id = u.id);
    return jsonb_build_object('statuses', result);
  end if;

  if p_active is null then
    raise exception 'Aktif/pasif seçimi gerekli.' using errcode = '22023';
  end if;
  if p_user_id = actor then
    raise exception 'Kendi hesabınızın durumunu değiştiremezsiniz.' using errcode = '22023';
  end if;

  update auth.users u
  set banned_until = case when p_active then null else now() + interval '100 years' end,
      updated_at = now()
  where u.id <> actor
    and (p_user_id is null or u.id = p_user_id)
    and exists (select 1 from public.profiles p where p.id = u.id);
  get diagnostics affected = row_count;
  if p_user_id is not null and affected = 0 then
    raise exception 'Kullanıcı bulunamadı.' using errcode = 'P0002';
  end if;
  return jsonb_build_object('updated', affected, 'errors', '[]'::jsonb);
end;
$$;

-- API'ye açılan sarmalayıcı yetki yükseltmez; doğrulama özel işlevde yapılır.
create or replace function public.manage_user_status(
  p_action text, p_active boolean default null, p_user_id uuid default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select tablogorusler_private.manage_user_status(p_action, p_active, p_user_id);
$$;

revoke all on function tablogorusler_private.manage_user_status(text, boolean, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.manage_user_status(text, boolean, uuid)
  from public, anon, authenticated, service_role;
grant execute on function tablogorusler_private.manage_user_status(text, boolean, uuid)
  to authenticated;
grant execute on function public.manage_user_status(text, boolean, uuid)
  to authenticated;

notify pgrst, 'reload schema';
commit;

select 'Kurulum tamamlandı. Sitede Ctrl+F5 yapıp Durumları yenile düğmesine basın.' as sonuc;
