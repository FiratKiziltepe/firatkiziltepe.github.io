-- ============================================================
-- v18 — screenshots in reviewer notes
-- Additive only. A note may carry up to 12 images (e.g. the part of the
-- full text that matches an inclusion criterion). The image files live in
-- the private Storage bucket "note-images"; votes.images keeps their paths.
--   path: <project_id>/<user_id>/<random>.<ext>
-- Who may see an image follows the votes: the author always, other members
-- only when they may see the votes of the project (blind mode respected).
-- ============================================================

alter table public.votes add column if not exists images text[] not null default '{}';
alter table public.votes drop constraint if exists votes_images_max;
alter table public.votes add constraint votes_images_max check (cardinality(images) <= 12);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('note-images', 'note-images', false, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- project id of a note image path, null for anything malformed (never raises)
create or replace function private.note_image_project(path text) returns uuid
language sql immutable set search_path = '' as $$
  select case when split_part(path, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(path, '/', 1)::uuid end;
$$;
revoke execute on function private.note_image_project(text) from public, anon;
grant execute on function private.note_image_project(text) to authenticated;

drop policy if exists note_images_select on storage.objects;
create policy note_images_select on storage.objects for select to authenticated
  using (bucket_id = 'note-images' and (
    split_part(name, '/', 2) = (select auth.uid())::text
    or private.can_see_votes(private.note_image_project(name))));

drop policy if exists note_images_insert on storage.objects;
create policy note_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'note-images'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and private.is_member(private.note_image_project(name)));

drop policy if exists note_images_delete on storage.objects;
create policy note_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'note-images' and (
    split_part(name, '/', 2) = (select auth.uid())::text
    or private.is_admin()));
