-- LuxeEstate — rental listings and landlord profiles
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- It is idempotent: running it twice is harmless.

------------------------------------------------------------------------------
-- 1. One vocabulary for listing_type
--
-- Four writers disagreed. The admin form writes 'sale'/'rent'/'sold'; the seed
-- script and the mock generator wrote 'buy'/'rent'; rows created before the
-- column existed are NULL; and the rows currently in this database hold the
-- *tag* strings, 'FOR SALE' and 'FOR RENT'.
--
-- The homepage now filters on this column, and in Postgres a NULL satisfies
-- neither `=` nor `<>`, so leaving any of that in place would make rows vanish
-- from the site with no error anywhere.
--
-- Everything unrecognised becomes 'sale', which keeps a listing visible rather
-- than hiding it in a modality nobody browses.
------------------------------------------------------------------------------

update public.properties
   set listing_type = case
     when listing_type is null                       then 'sale'
     when lower(trim(listing_type)) in
       ('rent', 'for rent', 'for_rent', 'rental')    then 'rent'
     when lower(trim(listing_type)) in
       ('sold', 'for sold')                          then 'sold'
     else 'sale'
   end;

alter table public.properties
  alter column listing_type set default 'sale';

alter table public.properties
  alter column listing_type set not null;

alter table public.properties
  drop constraint if exists properties_listing_type_check;
alter table public.properties
  add constraint properties_listing_type_check
  check (listing_type in ('sale', 'rent', 'sold'));

------------------------------------------------------------------------------
-- 2. Landlord profiles
--
-- user_id is nullable on purpose: a landlord can be listed before the person
-- ever signs in, and the profile is claimed later by setting this column. That
-- is also what lets the seed script insert landlords without creating accounts.
------------------------------------------------------------------------------

create table if not exists public.landlords (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references auth.users (id) on delete set null,
  slug                text not null,
  display_name        text not null,
  kind                text not null default 'individual',
  avatar_url          text,
  phone               text,
  email_public        text,
  bio                 text,
  languages           text[] not null default '{}',
  is_verified         boolean not null default false,
  member_since        date,
  response_time_hours integer,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create unique index if not exists landlords_slug_key on public.landlords (slug);

alter table public.landlords
  drop constraint if exists landlords_kind_check;
alter table public.landlords
  add constraint landlords_kind_check
  check (kind in ('individual', 'agency'));

------------------------------------------------------------------------------
-- 3. Rental columns on properties
--
-- All null for sales. The CHECK in section 4 keeps them consistent.
------------------------------------------------------------------------------

alter table public.properties
  add column if not exists rental_kind        text,
  add column if not exists price_period       text,
  add column if not exists min_stay_months    integer,
  add column if not exists deposit_months     numeric,
  add column if not exists utilities_included boolean,
  add column if not exists furnished          boolean,
  add column if not exists available_from     date,
  add column if not exists landlord_id        uuid references public.landlords (id) on delete set null;

-- Rows that were already 'rent' before this migration have no modality, and the
-- CHECK below would reject them. Long-term monthly is the safe assumption.
update public.properties
   set rental_kind  = coalesce(rental_kind, 'long'),
       price_period = coalesce(price_period, 'month')
 where listing_type = 'rent';

-- price_display is rendered verbatim on every card, and the existing rentals
-- were saved as a bare amount ("$3,200") because the "/mo" used to be appended
-- in the component. That suffix now travels with the value, so a rent saved
-- without one would read as if it were a purchase price.
update public.properties
   set price_display = price_display || '/mo'
 where listing_type = 'rent'
   and price_display is not null
   and price_display <> ''
   and position('/' in price_display) = 0;

------------------------------------------------------------------------------
-- 4. Constraints tying the rental fields to the listing type
------------------------------------------------------------------------------

alter table public.properties
  drop constraint if exists properties_rental_kind_check;
alter table public.properties
  add constraint properties_rental_kind_check
  check (rental_kind is null or rental_kind in
    ('long', 'seasonal', 'student', 'room', 'vacation', 'commercial'));

alter table public.properties
  drop constraint if exists properties_price_period_check;
alter table public.properties
  add constraint properties_price_period_check
  check (price_period is null or price_period in ('month', 'night'));

-- A rental must say what it is and how it is priced; a sale must not pretend to
alter table public.properties
  drop constraint if exists properties_rental_fields_check;
alter table public.properties
  add constraint properties_rental_fields_check
  check (
    (listing_type =  'rent' and rental_kind is not null and price_period is not null)
    or
    (listing_type <> 'rent' and rental_kind is null and price_period is null)
  );

------------------------------------------------------------------------------
-- 5. Comparable monthly price
--
-- price_value holds the amount in the listing's own unit, so a 90/night holiday
-- let and a 2,400/month long let are not comparable with a plain `>=`. This
-- generated column normalises them for filtering and sorting. Being STORED and
-- derived, it can never drift out of sync the way an application-maintained
-- column would.
------------------------------------------------------------------------------

alter table public.properties
  drop column if exists rent_monthly_eq;
alter table public.properties
  add column rent_monthly_eq numeric
  generated always as (
    case
      when listing_type <> 'rent' then null
      when price_period = 'night' then price_value * 30
      else price_value
    end
  ) stored;

create index if not exists properties_rent_idx
  on public.properties (listing_type, rental_kind, rent_monthly_eq);

create index if not exists properties_landlord_idx
  on public.properties (landlord_id);

------------------------------------------------------------------------------
-- 6. Row level security for landlords
--
-- Deliberately NO public select policy. The anon key ships in the browser
-- bundle, so a `using (true)` policy here would make every landlord's phone
-- number downloadable in one request. Public reads go through the view below,
-- which does not select the contact columns at all.
------------------------------------------------------------------------------

alter table public.landlords enable row level security;

drop policy if exists "landlords_admin_write" on public.landlords;
create policy "landlords_admin_write"
  on public.landlords for all
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

-- A view without security_invoker runs as its owner, so it reads through the
-- RLS above. phone and email_public are absent by construction.
drop view if exists public.landlords_public;
create view public.landlords_public as
  select id,
         slug,
         display_name,
         kind,
         avatar_url,
         bio,
         languages,
         is_verified,
         member_since,
         response_time_hours
    from public.landlords
   where is_active;

grant select on public.landlords_public to anon, authenticated;
