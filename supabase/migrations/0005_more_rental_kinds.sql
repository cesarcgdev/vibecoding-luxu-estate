-- LuxeEstate — four more rental modalities
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- It is idempotent: running it twice is harmless.
--
-- Requires 0004_rentals_and_landlords.sql.

------------------------------------------------------------------------------
-- Widen the modality vocabulary
--
-- The six original modalities covered the common cases. These four cover the
-- ones that behave differently enough to be worth their own tab:
--
--   coliving     a room in a managed shared house, billed all-in
--   rent_to_own  rent that counts towards an eventual purchase
--   storage      a garage or storage unit — no bedrooms, no bathrooms
--   corporate    company lets, invoiced to a business
--
-- All four are priced monthly, so rent_monthly_eq needs no change: its CASE
-- only special-cases 'night', and everything else falls through to price_value.
------------------------------------------------------------------------------

alter table public.properties
  drop constraint if exists properties_rental_kind_check;
alter table public.properties
  add constraint properties_rental_kind_check
  check (rental_kind is null or rental_kind in (
    'long',
    'seasonal',
    'student',
    'room',
    'vacation',
    'commercial',
    'coliving',
    'rent_to_own',
    'storage',
    'corporate'
  ));
