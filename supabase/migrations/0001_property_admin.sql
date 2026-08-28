-- LuxeEstate — admin property management setup
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- It is idempotent: running it twice is harmless.

------------------------------------------------------------------------------
-- 1. Columns the admin property form writes but the table did not have
------------------------------------------------------------------------------

alter table public.properties
  add column if not exists description   text,
  add column if not exists property_type text,
  add column if not exists year_built    integer,
  add column if not exists parking       integer not null default 0,
  add column if not exists amenities     text[]  not null default '{}';

-- The slug is used as the public URL, so it has to be unique
create unique index if not exists properties_slug_key on public.properties (slug);

------------------------------------------------------------------------------
-- 2. Row level security — public read, admin write
------------------------------------------------------------------------------

alter table public.properties enable row level security;

drop policy if exists "properties_public_read" on public.properties;
create policy "properties_public_read"
  on public.properties for select
  using (true);

drop policy if exists "properties_admin_write" on public.properties;
create policy "properties_admin_write"
  on public.properties for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
  );

------------------------------------------------------------------------------
-- 3. Storage bucket for property images
------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "property_images_admin_write" on storage.objects;
create policy "property_images_admin_write"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
  )
  with check (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
  );

-- Note: the service role bypasses every policy above. That is how the admin
-- panel writes while ADMIN_DEV_BYPASS is on and there is no signed-in admin —
-- see SUPABASE_SERVICE_ROLE_KEY in .env.template.
