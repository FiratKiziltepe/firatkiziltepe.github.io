export { nas, API_BASE, request } from './nasClient';

export type Profile = {
  id: string;
  kullanici_adi: string;
  ad_soyad: string;
  brans: string;
  rol: 'admin' | 'moderator' | 'teacher';
  atanan_dersler: string[];
  sifre?: string | null;
  sifre_degistirildi?: boolean;
  created_at: string;
  updated_at: string;
};

export type EIcerik = {
  id: number;
  sira_no: number;
  ders_adi: string;
  unite_tema: string;
  kazanim: string;
  e_icerik_turu: string;
  aciklama: string;
  program_turu: string;
  created_at: string;
  updated_at: string;
};

export type DegisiklikOnerisi = {
  id: number;
  e_icerik_id: number;
  user_id: string;
  alan: string;
  eski_deger: string;
  yeni_deger: string;
  durum: 'pending' | 'approved' | 'rejected';
  onaylayan_id: string | null;
  red_nedeni: string | null;
  gerekce: string | null;
  created_at: string;
  onay_tarihi: string | null;
};

export type YeniSatirOnerisi = {
  id: number;
  user_id: string;
  ders_adi: string;
  unite_tema: string;
  kazanim: string;
  e_icerik_turu: string;
  aciklama: string;
  program_turu: string;
  durum: 'pending' | 'approved' | 'rejected';
  onaylayan_id: string | null;
  red_nedeni: string | null;
  gerekce: string | null;
  created_at: string;
  onay_tarihi: string | null;
};

export type SilmeTalebi = {
  id: number;
  e_icerik_id: number;
  user_id: string;
  durum: 'pending' | 'approved' | 'rejected';
  onaylayan_id: string | null;
  red_nedeni: string | null;
  aciklama: string | null;
  created_at: string;
  onay_tarihi: string | null;
};

export type DegisiklikLogu = {
  id: number;
  e_icerik_id: number | null;
  user_id: string;
  islem_tipi: string;
  alan: string | null;
  eski_deger: string | null;
  yeni_deger: string | null;
  aciklama: string | null;
  created_at: string;
};

