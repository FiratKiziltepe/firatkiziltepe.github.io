import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://prtogxfwngpkgmyzeirg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydG9neGZ3bmdwa2dteXplaXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjk5NTksImV4cCI6MjA4NTcwNTk1OX0.zRDVCETeF1SpZw8BlyLHGziNNgSa-rXnw0jst-Y0fPw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const SUPABASE_URL = supabaseUrl;

export type Profile = {
  id: string;
  kullanici_adi: string;
  ad_soyad: string;
  brans: string;
  rol: 'admin' | 'moderator' | 'teacher';
  atanan_dersler: string[];
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

