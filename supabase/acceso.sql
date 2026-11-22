-- =====================================================================
--  Mis Viajes · Solicitudes de acceso (v8)
--  Pégalo entero en Supabase → SQL Editor → Run.  Se puede repetir sin miedo.
--
--  Cómo funciona:
--   · Cualquiera puede pulsar "Pedir acceso" y crearse una cuenta…
--   · …pero NO ve nada (ni nombres, ni viajes, ni fotos) hasta que
--     el administrador (tú) lo acepta desde la app: Más → Solicitudes.
--   · La primera vez que se ejecuta: todas las cuentas que ya existen
--     quedan aprobadas y la más antigua (la tuya) queda como administrador.
-- =====================================================================

-- ---------- Permisos básicos (por si el proyecto es nuevo) ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- ---------- Tablas ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.aprobados (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creado  timestamptz default now()
);
create table if not exists public.solicitudes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email   text,
  nombre  text,
  creado  timestamptz default now()
);
alter table public.admins      enable row level security;
alter table public.aprobados   enable row level security;
alter table public.solicitudes enable row level security;

-- Primera vez: aprobar a los que ya existen y nombrar administrador al más antiguo
insert into public.aprobados (user_id)
  select id from auth.users where not exists (select 1 from public.aprobados);
insert into public.admins (user_id)
  select id from auth.users where not exists (select 1 from public.admins)
  order by created_at limit 1;

-- ---------- Funciones de ayuda ----------
create or replace function public.aprobado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.aprobados where user_id = auth.uid());
$$;
create or replace function public.soy_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Lo que la app pregunta al entrar: ¿estoy aprobado?, ¿soy admin?
create or replace function public.mi_estado() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'estado', case when exists (select 1 from public.aprobados   where user_id = auth.uid()) then 'aprobado'
                   when exists (select 1 from public.solicitudes where user_id = auth.uid()) then 'pendiente'
                   else 'rechazado' end,
    'admin', exists (select 1 from public.admins where user_id = auth.uid()));
$$;

-- Cada cuenta nueva crea su solicitud automáticamente
create or replace function public.nueva_solicitud() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.solicitudes (user_id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists al_crear_cuenta on auth.users;
create trigger al_crear_cuenta after insert on auth.users
  for each row execute function public.nueva_solicitud();

-- Aceptar / rechazar (solo el administrador)
create or replace function public.aceptar_solicitud(u uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.soy_admin() then raise exception 'Solo el administrador puede aceptar'; end if;
  insert into public.aprobados (user_id) values (u) on conflict do nothing;
  delete from public.solicitudes where user_id = u;
end $$;
create or replace function public.rechazar_solicitud(u uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.soy_admin() then raise exception 'Solo el administrador puede rechazar'; end if;
  delete from public.solicitudes where user_id = u;
  delete from public.aprobados   where user_id = u;
  delete from public.perfiles    where user_id = u;
end $$;

-- Solicitudes: cada uno ve la suya, el administrador las ve todas
drop policy if exists "ver solicitudes" on public.solicitudes;
create policy "ver solicitudes" on public.solicitudes for select to authenticated
  using (user_id = auth.uid() or public.soy_admin());
drop policy if exists "ver admins" on public.admins;
create policy "ver admins" on public.admins for select to authenticated using (public.soy_admin());
drop policy if exists "ver aprobados" on public.aprobados;
create policy "ver aprobados" on public.aprobados for select to authenticated using (user_id = auth.uid() or public.soy_admin());

-- ---------- El candado: sin aprobar no se ve ni se toca nada ----------
do $$
declare t text;
begin
  foreach t in array array['perfiles','viajes','viaje_miembros','fotos','deseos','ajustes','mensajes'] loop
    execute format('drop policy if exists "solo aprobados" on public.%I', t);
    execute format('create policy "solo aprobados" on public.%I as restrictive for all to authenticated using (public.aprobado()) with check (public.aprobado())', t);
  end loop;
end $$;

drop policy if exists "fotos solo aprobados" on storage.objects;
create policy "fotos solo aprobados" on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'fotos' or public.aprobado())
  with check (bucket_id <> 'fotos' or public.aprobado());

grant execute on function public.aprobado(), public.soy_admin(), public.mi_estado(),
  public.aceptar_solicitud(uuid), public.rechazar_solicitud(uuid) to authenticated;
revoke execute on function public.aceptar_solicitud(uuid), public.rechazar_solicitud(uuid) from anon;

notify pgrst, 'reload schema';
