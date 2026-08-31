-- LuxeEstate — bathrooms are whole rooms
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- It is idempotent: running it twice is harmless.

------------------------------------------------------------------------------
-- `baths` was a numeric column, so three listings carried the US "2.5 baths"
-- convention — 2 full baths plus a half bath (toilet and sink, no shower):
--
--   historic-townhouse   2.5   sale
--   the-glass-pavilion   4.5   sale
--   riverfront-estate    3.5   rent
--
-- Nothing in the product speaks that convention. The cards, the detail page
-- and the admin list all print the raw number next to "Baños"/"Baths", and the
-- filters compare it with `parseInt`, so a 2.5-bath listing already answered a
-- "2+ baths" filter as if it had two. The half only ever read as noise.
--
-- Rounding up rather than down: a half bath is still a room you walk into, so
-- 2.5 describes three bathrooms, one of them without a shower. Rounding down
-- would delete a room the listing actually has.
--
-- The type change is what keeps it from coming back — the admin stepper only
-- ever writes integers, but the column was what allowed the fractions in.
------------------------------------------------------------------------------

alter table public.properties
  alter column baths type integer using ceil(baths)::integer;

alter table public.properties
  drop constraint if exists properties_baths_check;
alter table public.properties
  add constraint properties_baths_check
  check (baths is null or baths >= 0);
