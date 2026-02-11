-- Eşzamanlı kullanımda sorgu performansı ve onay/ret işlemlerinde tutarlılık iyileştirmeleri

create index if not exists idx_e_icerikler_ders_sira
  on public.e_icerikler (ders_adi, sira_no);

create index if not exists idx_e_icerikler_program_ders
  on public.e_icerikler (program_turu, ders_adi);

create index if not exists idx_degisiklik_onerileri_pending_lookup
  on public.degisiklik_onerileri (e_icerik_id, alan, durum, created_at desc);

create index if not exists idx_yeni_satir_onerileri_pending_lookup
  on public.yeni_satir_onerileri (durum, created_at desc);

create index if not exists idx_silme_talepleri_pending_lookup
  on public.silme_talepleri (e_icerik_id, durum, created_at desc);

create or replace function public.resolve_proposal_atomic(
  p_type text,
  p_proposal_id bigint,
  p_durum text,
  p_onaylayan_id uuid,
  p_red_nedeni text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_role text;
  v_deg public.degisiklik_onerileri%rowtype;
  v_new public.yeni_satir_onerileri%rowtype;
  v_del public.silme_talepleri%rowtype;
  v_next_sira integer;
begin
  if p_type not in ('degisiklik', 'yeni_satir', 'silme') then
    raise exception 'Geçersiz talep tipi: %', p_type;
  end if;

  if p_durum not in ('approved', 'rejected') then
    raise exception 'Geçersiz durum: %', p_durum;
  end if;

  if auth.uid() is null or auth.uid() <> p_onaylayan_id then
    raise exception 'Yetkisiz işlem';
  end if;

  select rol into v_role
  from public.profiles
  where id = p_onaylayan_id;

  if v_role not in ('admin', 'moderator') then
    raise exception 'Bu işlem için admin/moderator rolü gerekli';
  end if;

  if p_type = 'degisiklik' then
    select * into v_deg
    from public.degisiklik_onerileri
    where id = p_proposal_id
    for update;

    if not found then
      raise exception 'Değişiklik önerisi bulunamadı: %', p_proposal_id;
    end if;

    if v_deg.durum <> 'pending' then
      return jsonb_build_object('status', 'noop', 'reason', 'already_resolved', 'type', p_type, 'proposal_id', p_proposal_id);
    end if;

    update public.degisiklik_onerileri
    set
      durum = p_durum,
      onaylayan_id = p_onaylayan_id,
      onay_tarihi = v_now,
      red_nedeni = p_red_nedeni
    where id = p_proposal_id;

    if p_durum = 'approved' then
      execute format(
        'update public.e_icerikler set %I = $1, updated_at = $2 where id = $3',
        v_deg.alan
      ) using v_deg.yeni_deger, v_now, v_deg.e_icerik_id;

      update public.degisiklik_onerileri
      set
        durum = 'rejected',
        onaylayan_id = p_onaylayan_id,
        onay_tarihi = v_now,
        red_nedeni = 'Aynı alan için başka bir öneri onaylandı'
      where id <> p_proposal_id
        and e_icerik_id = v_deg.e_icerik_id
        and alan = v_deg.alan
        and durum = 'pending';
    end if;
  elsif p_type = 'yeni_satir' then
    select * into v_new
    from public.yeni_satir_onerileri
    where id = p_proposal_id
    for update;

    if not found then
      raise exception 'Yeni satır önerisi bulunamadı: %', p_proposal_id;
    end if;

    if v_new.durum <> 'pending' then
      return jsonb_build_object('status', 'noop', 'reason', 'already_resolved', 'type', p_type, 'proposal_id', p_proposal_id);
    end if;

    update public.yeni_satir_onerileri
    set
      durum = p_durum,
      onaylayan_id = p_onaylayan_id,
      onay_tarihi = v_now,
      red_nedeni = p_red_nedeni
    where id = p_proposal_id;

    if p_durum = 'approved' then
      lock table public.e_icerikler in share row exclusive mode;
      select coalesce(max(sira_no), 0) + 1 into v_next_sira from public.e_icerikler;

      insert into public.e_icerikler (
        sira_no, ders_adi, unite_tema, kazanim, e_icerik_turu, aciklama, program_turu, created_at, updated_at
      ) values (
        v_next_sira, v_new.ders_adi, v_new.unite_tema, v_new.kazanim, v_new.e_icerik_turu, v_new.aciklama, v_new.program_turu, v_now, v_now
      );
    end if;
  else
    select * into v_del
    from public.silme_talepleri
    where id = p_proposal_id
    for update;

    if not found then
      raise exception 'Silme talebi bulunamadı: %', p_proposal_id;
    end if;

    if v_del.durum <> 'pending' then
      return jsonb_build_object('status', 'noop', 'reason', 'already_resolved', 'type', p_type, 'proposal_id', p_proposal_id);
    end if;

    update public.silme_talepleri
    set
      durum = p_durum,
      onaylayan_id = p_onaylayan_id,
      onay_tarihi = v_now,
      red_nedeni = p_red_nedeni
    where id = p_proposal_id;

    if p_durum = 'approved' then
      delete from public.e_icerikler
      where id = v_del.e_icerik_id;

      update public.silme_talepleri
      set
        durum = 'rejected',
        onaylayan_id = p_onaylayan_id,
        onay_tarihi = v_now,
        red_nedeni = 'Satır başka bir talep ile silindi'
      where id <> p_proposal_id
        and e_icerik_id = v_del.e_icerik_id
        and durum = 'pending';

      update public.degisiklik_onerileri
      set
        durum = 'rejected',
        onaylayan_id = p_onaylayan_id,
        onay_tarihi = v_now,
        red_nedeni = 'Satır silme talebi onaylandığı için reddedildi'
      where e_icerik_id = v_del.e_icerik_id
        and durum = 'pending';
    end if;
  end if;

  return jsonb_build_object('status', 'ok', 'type', p_type, 'proposal_id', p_proposal_id, 'durum', p_durum);
end;
$$;

grant execute on function public.resolve_proposal_atomic(text, bigint, text, uuid, text) to authenticated;

