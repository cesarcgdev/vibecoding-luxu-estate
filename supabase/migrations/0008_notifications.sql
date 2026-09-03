-- LuxeEstate — alertas de propiedades guardadas (cambios de precio + disponibilidad)
-- Ejecuta esto una vez en el panel de Supabase → SQL Editor → New query → Run.
-- Es idempotente: ejecutarlo dos veces no causa ningún problema.

create table if not exists public.notifications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  -- Admite null, y ON DELETE SET NULL en vez de CASCADE: la notificación de
  -- "esta vivienda ya no está disponible" se escribe en el mismo momento en
  -- que la propiedad desaparece, así que la fila tiene que sobrevivir a ese
  -- borrado. property_title/slug/image son una foto fija tomada en el
  -- momento de insertar, precisamente para que la notificación se siga
  -- viendo bien aunque property_id termine en null.
  property_id        uuid references public.properties (id) on delete set null,
  property_title     text,
  property_slug      text,
  property_image     text,
  type               text not null default 'price_change',
  old_price_value    numeric,
  new_price_value    numeric,
  old_price_display  text,
  new_price_display  text,
  read               boolean not null default false,
  created_at         timestamptz not null default now()
);

------------------------------------------------------------------------------
-- Parchea una tabla que ya existiera desde la primera versión de esta
-- migración, anterior a las columnas de foto fija, donde property_id era
-- NOT NULL con ON DELETE CASCADE. `create table if not exists` de arriba no
-- hace nada si la tabla ya existe, así que quien haya ejecutado esa versión
-- necesita aplicar esto a mano — este bloque también es seguro de ejecutar
-- sobre una tabla que nunca tuvo esa forma antigua, porque cada paso queda
-- convertido en un no-op protegido.
------------------------------------------------------------------------------

alter table public.notifications
  add column if not exists property_title text,
  add column if not exists property_slug  text,
  add column if not exists property_image text;

update public.notifications n
   set property_title = p.title,
       property_slug  = p.slug,
       property_image = p.images[1]
  from public.properties p
 where n.property_id = p.id
   and n.property_title is null;

alter table public.notifications alter column property_title set not null;
alter table public.notifications alter column property_slug set not null;

alter table public.notifications alter column property_id drop not null;
alter table public.notifications alter column old_price_display drop not null;
alter table public.notifications alter column new_price_display drop not null;

alter table public.notifications drop constraint if exists notifications_property_id_fkey;
alter table public.notifications
  add constraint notifications_property_id_fkey
  foreign key (property_id) references public.properties (id) on delete set null;

alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('price_change', 'removed', 'available_again'));

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

------------------------------------------------------------------------------
-- Seguridad a nivel de fila — cada usuario solo lee, marca como leídas o
-- borra sus propias notificaciones. A propósito no hay política de insert
-- para `authenticated`: cada fila la escribe uno de los triggers de abajo,
-- que se ejecutan como su propietario y se saltan la RLS.
------------------------------------------------------------------------------

alter table public.notifications enable row level security;

drop policy if exists "notifications_owner_select" on public.notifications;
create policy "notifications_owner_select"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_owner_delete" on public.notifications;
create policy "notifications_owner_delete"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

------------------------------------------------------------------------------
-- Realtime — hace que la campanita del navbar se encienda al instante cuando
-- pasa algo con una propiedad guardada, sin que el visitante recargue la
-- página. Realtime sigue aplicando la política de SELECT de arriba por cada
-- conexión, así que cada usuario solo recibe sus propias filas.
------------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

------------------------------------------------------------------------------
-- Trigger 1 — cambios de precio.
--
-- Todas las funciones de abajo son SECURITY DEFINER porque las filas se
-- escriben en nombre de los usuarios que guardaron la propiedad, no del
-- admin que hace la edición — las políticas "solo el dueño" de arriba, si
-- no, bloquearían cada insert.
------------------------------------------------------------------------------

create or replace function public.notify_saved_property_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications
    (user_id, property_id, property_title, property_slug, property_image,
     type, old_price_value, new_price_value, old_price_display, new_price_display)
  select sp.user_id, new.id, new.title, new.slug, new.images[1],
         'price_change', old.price_value, new.price_value, old.price_display, new.price_display
    from public.saved_properties sp
   where sp.property_id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_notify_price_change on public.properties;
create trigger trg_notify_price_change
  after update of price_value on public.properties
  for each row
  when (new.price_value is distinct from old.price_value)
  execute function public.notify_saved_property_price_change();

------------------------------------------------------------------------------
-- Trigger 2 — una vivienda se oculta o se vuelve a publicar (el botón de
-- "ocultar" del admin, o is_active cambiado desde el formulario de edición).
------------------------------------------------------------------------------

create or replace function public.notify_saved_property_availability_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications
    (user_id, property_id, property_title, property_slug, property_image, type)
  select sp.user_id, new.id, new.title, new.slug, new.images[1],
         case when new.is_active then 'available_again' else 'removed' end
    from public.saved_properties sp
   where sp.property_id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_notify_availability_change on public.properties;
create trigger trg_notify_availability_change
  after update of is_active on public.properties
  for each row
  when (new.is_active is distinct from old.is_active)
  execute function public.notify_saved_property_availability_change();

------------------------------------------------------------------------------
-- Trigger 3 — una vivienda se elimina directamente.
--
-- BEFORE DELETE, no AFTER: saved_properties tiene su propio cascade desde
-- esta misma fila de properties, e igual pasa con el property_id de esta
-- tabla (arriba). Cualquiera de los dos cascades se ejecuta dentro de la
-- misma sentencia DELETE, así que un trigger AFTER se encontraría
-- saved_properties ya vacía (nadie a quien avisar), y la fila que este
-- trigger acabara de insertar quedaría con property_id a null en el
-- instante en que el borrado termina. Disparándolo ANTES de que la fila
-- desaparezca de verdad se evitan los dos problemas.
------------------------------------------------------------------------------

create or replace function public.notify_saved_property_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications
    (user_id, property_id, property_title, property_slug, property_image, type)
  select sp.user_id, old.id, old.title, old.slug, old.images[1], 'removed'
    from public.saved_properties sp
   where sp.property_id = old.id;

  return old;
end;
$$;

drop trigger if exists trg_notify_property_deleted on public.properties;
create trigger trg_notify_property_deleted
  before delete on public.properties
  for each row
  execute function public.notify_saved_property_deleted();
