-- ============================================================
-- Makale Yönetim Sistemi - Supabase Schema
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  display_name text not null default '',
  role text not null default 'viewer' check (role in ('admin', 'advisor', 'viewer')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles herkese açık okuma"
  on public.profiles for select using (true);

create policy "Kullanıcı kendi profilini güncelleyebilir"
  on public.profiles for update using (auth.uid() = id);

create policy "Admin profil oluşturabilir"
  on public.profiles for insert with check (true);

-- Auth trigger: yeni kullanıcı oluşturulunca otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. COLUMNS_CONFIG
create table if not exists public.columns_config (
  id serial primary key,
  column_key text unique not null,
  name text not null,
  type text not null default 'text' check (type in ('text','longtext','select','multiselect','url','boolean','rating','date')),
  visible boolean not null default true,
  sort_order int not null default 0,
  options jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table public.columns_config enable row level security;

create policy "columns_config herkese açık okuma"
  on public.columns_config for select using (true);

create policy "Admin sütun ekleyebilir"
  on public.columns_config for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin sütun güncelleyebilir"
  on public.columns_config for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin sütun silebilir"
  on public.columns_config for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- 3. ARTICLES
create table if not exists public.articles (
  id serial primary key,
  data jsonb not null default '{}'::jsonb,
  rating int not null default 0 check (rating >= 0 and rating <= 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.articles enable row level security;

create policy "articles herkese açık okuma"
  on public.articles for select using (true);

create policy "Admin makale ekleyebilir"
  on public.articles for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin makale güncelleyebilir"
  on public.articles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin makale silebilir"
  on public.articles for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- updated_at otomatik güncelleme
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.update_updated_at();


-- 4. ADVISOR_NOTES
create table if not exists public.advisor_notes (
  id serial primary key,
  article_id int references public.articles(id) on delete cascade not null,
  advisor_id uuid references public.profiles(id) on delete cascade not null,
  note text not null default '',
  created_at timestamptz default now()
);

alter table public.advisor_notes enable row level security;

create policy "advisor_notes herkese açık okuma"
  on public.advisor_notes for select using (true);

create policy "Danışman ve admin not ekleyebilir"
  on public.advisor_notes for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'advisor'))
  );

create policy "Yazar kendi notunu güncelleyebilir"
  on public.advisor_notes for update
  using (advisor_id = auth.uid());

create policy "Yazar veya admin notu silebilir"
  on public.advisor_notes for delete
  using (
    advisor_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- 5. VARSAYILAN SÜTUNLAR
insert into public.columns_config (column_key, name, type, visible, sort_order, options) values
  ('title',       'Makale Adı',        'text',        true,  1,  '[]'),
  ('url',         'URL',               'url',         true,  2,  '[]'),
  ('status',      'Durum',             'select',      true,  3,  '["Okunacak","Okunuyor","Okundu","Özetlendi","Bırakıldı"]'),
  ('relation',    'İlişki Derecesi',   'select',      true,  4,  '["İlişkisiz","Kısmen","Doğrudan","Temel Kaynak"]'),
  ('section',     'Tez Bölümü',        'select',      true,  5,  '["Giriş","Kuramsal Çerçeve","Yöntem","Bulgular","Tartışma"]'),
  ('author',      'Yazar(lar)',        'text',        true,  6,  '[]'),
  ('year',        'Yıl',              'text',        true,  7,  '[]'),
  ('method',      'Yöntem',           'text',        true,  8,  '[]'),
  ('summary',     'Özet',             'longtext',    true,  9,  '[]'),
  ('findings',    'Bulgular / Etki',  'longtext',    true, 10,  '[]'),
  ('suggestions', 'Öneriler',         'longtext',    false, 11, '[]'),
  ('tags',        'Etiketler',        'multiselect', true, 12,  '[]'),
  ('notes',       'Önemli Notlarım',  'longtext',    true, 13,  '[]')
on conflict (column_key) do nothing;
