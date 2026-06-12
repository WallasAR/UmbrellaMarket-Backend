-- Bucket público para imagens de layout e banners institucionais.
-- Execute no Supabase SQL Editor antes de usar uploads em produção (Render).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banners',
  'banners',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública (URLs diretas no frontend)
drop policy if exists "Public read banners" on storage.objects;
create policy "Public read banners"
on storage.objects for select
to public
using (bucket_id = 'banners');
