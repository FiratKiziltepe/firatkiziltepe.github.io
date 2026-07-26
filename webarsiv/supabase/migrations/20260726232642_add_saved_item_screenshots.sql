alter table public.saved_items
  add column if not exists screenshot_path text not null default '',
  add column if not exists screenshot_mime_type text not null default '',
  add column if not exists screenshot_file_id text not null default '';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'webarsivi-screenshots',
  'webarsivi-screenshots',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
