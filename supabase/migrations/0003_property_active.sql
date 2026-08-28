-- LuxeEstate — active/hidden flag for property listings
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- It is idempotent: running it twice is harmless.

------------------------------------------------------------------------------
-- Publication state. Properties are hidden instead of deleted: a hidden row
-- keeps its images and stays editable in the admin panel, it just never shows
-- up on the homepage, in search, or on its own detail page.
------------------------------------------------------------------------------

alter table public.properties
  add column if not exists is_active boolean not null default true;

-- Existing rows backfill to true, so nothing disappears when this runs.
create index if not exists properties_is_active_idx on public.properties (is_active);