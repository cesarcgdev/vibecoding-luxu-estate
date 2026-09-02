-- LuxeEstate — saved properties ("Guardados")
-- Run this once in the Supabase dashboard → SQL Editor → New query → Run.
-- It is idempotent: running it twice is harmless.

create table if not exists public.saved_properties (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, property_id)
);

create index if not exists saved_properties_user_id_idx on public.saved_properties (user_id);
create index if not exists saved_properties_property_id_idx on public.saved_properties (property_id);

------------------------------------------------------------------------------
-- Row level security — a user only ever reads or writes their own rows
------------------------------------------------------------------------------

alter table public.saved_properties enable row level security;

drop policy if exists "saved_properties_owner_select" on public.saved_properties;
create policy "saved_properties_owner_select"
  on public.saved_properties for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "saved_properties_owner_insert" on public.saved_properties;
create policy "saved_properties_owner_insert"
  on public.saved_properties for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "saved_properties_owner_delete" on public.saved_properties;
create policy "saved_properties_owner_delete"
  on public.saved_properties for delete
  to authenticated
  using (user_id = auth.uid());
