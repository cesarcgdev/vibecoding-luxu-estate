-- LuxeEstate — map coordinates for property listings
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- It is idempotent: running it twice is harmless.

------------------------------------------------------------------------------
-- Latitude / longitude written by the admin property form's map picker
------------------------------------------------------------------------------

alter table public.properties
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

alter table public.properties
  drop constraint if exists properties_latitude_range;
alter table public.properties
  add constraint properties_latitude_range
  check (latitude is null or (latitude between -90 and 90));

alter table public.properties
  drop constraint if exists properties_longitude_range;
alter table public.properties
  add constraint properties_longitude_range
  check (longitude is null or (longitude between -180 and 180));
