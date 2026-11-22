-- =====================================================================
--  MIS VIAJES · Preparación de la base de datos en Supabase
--  Pega TODO este archivo en Supabase → SQL Editor → New query → Run
--  (Se puede volver a ejecutar sin problema: no borra datos)
-- =====================================================================

-- ---------- Tablas ----------
create table if not exists public.perfiles (
  user_id     uuid primary key default auth.uid() references auth.users on delete cascade,
  nombre      text,
  casa_ciudad text,
  casa_lat    double precision,
  casa_lon    double precision,
  casa_pais   text default 'ES'
);

create table if not exists public.viajes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  pais       text not null,
  ciudad     text,
  lat        double precision,
  lon        double precision,
  inicio     date,
  fin        date,
  diario     text,
  sola       boolean not null default false,
  extra      jsonb not null default '{}'::jsonb,
  creado     timestamptz not null default now()
);

-- Personas con las que se comparte cada viaje (el dueño no hace falta que esté)
create table if not exists public.viaje_miembros (
  viaje_id   uuid not null references public.viajes on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  primary key (viaje_id, user_id)
);

create table if not exists public.fotos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  viaje_id   uuid not null references public.viajes on delete cascade,
  ruta       text not null,
  miniatura  text,
  instax     boolean not null default false,
  billete    boolean not null default false,
  audio      boolean not null default false,
  reserva    boolean not null default false,
  nombre     text,
  tipo       text,
  creado     timestamptz not null default now()
);

create table if not exists public.deseos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  pais       text not null,
  ciudad     text,
  lat        double precision,
  lon        double precision,
  nota       text,
  fecha      date,
  extra      jsonb not null default '{}'::jsonb,
  creado     timestamptz not null default now()
);

create table if not exists public.ajustes (
  user_id          uuid primary key default auth.uid() references auth.users on delete cascade,
  maleta           jsonb not null default '[]'::jsonb,
  compartir        boolean not null default false,
  compartir_diario boolean not null default false,
  token            text not null default replace(gen_random_uuid()::text, '-', ''),
  extra            jsonb not null default '{}'::jsonb
);

-- Mensajes privados: de bienvenida (al entrar) o escondidos en un país
create table if not exists public.mensajes (
  id      uuid primary key default gen_random_uuid(),
  autor   uuid not null default auth.uid() references auth.users on delete cascade,
  para    uuid not null references auth.users on delete cascade,
  tipo    text not null default 'pais' check (tipo in ('bienvenida', 'pais')),
  pais    text,
  titulo  text,
  texto   text not null,
  firma   text,
  visto   boolean not null default false,
  creado  timestamptz not null default now()
);

-- Por si la base de datos se creó con una versión anterior
alter table public.viajes  add column if not exists extra   jsonb not null default '{}'::jsonb;
alter table public.deseos  add column if not exists extra   jsonb not null default '{}'::jsonb;
alter table public.ajustes add column if not exists extra   jsonb not null default '{}'::jsonb;
alter table public.fotos   add column if not exists billete boolean not null default false;
alter table public.fotos   add column if not exists audio   boolean not null default false;
alter table public.fotos   add column if not exists reserva boolean not null default false;
alter table public.fotos   add column if not exists nombre  text;
alter table public.fotos   add column if not exists tipo    text;

create index if not exists viajes_user    on public.viajes(user_id);
create index if not exists fotos_viaje    on public.fotos(viaje_id);
create index if not exists deseos_user    on public.deseos(user_id);
create index if not exists miembros_user  on public.viaje_miembros(user_id);
create index if not exists mensajes_para  on public.mensajes(para);

-- ---------- ¿Puedo ver este viaje? (soy el dueño o estoy dentro) ----------
create or replace function public.puedo_ver_viaje(v uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from viajes where id = v and user_id = auth.uid())
      or exists (select 1 from viaje_miembros where viaje_id = v and user_id = auth.uid());
$$;

create or replace function public.soy_duenio_viaje(v uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from viajes where id = v and user_id = auth.uid());
$$;

-- Para las fotos guardadas: la ruta es  <usuario>/<viaje>/<archivo>
create or replace function public.puedo_ver_ruta(nombre text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  partes text[] := string_to_array(nombre, '/');
  v uuid;
begin
  if partes[1] = auth.uid()::text then return true; end if;
  begin
    v := partes[2]::uuid;
  exception when others then
    return false;
  end;
  return puedo_ver_viaje(v);
end;
$$;

grant execute on function public.puedo_ver_viaje(uuid) to authenticated;
grant execute on function public.soy_duenio_viaje(uuid) to authenticated;
grant execute on function public.puedo_ver_ruta(text) to authenticated;

-- ---------- Seguridad (cada fila solo la ve quien debe) ----------
alter table public.perfiles       enable row level security;
alter table public.viajes         enable row level security;
alter table public.viaje_miembros enable row level security;
alter table public.fotos          enable row level security;
alter table public.deseos         enable row level security;
alter table public.ajustes        enable row level security;
alter table public.mensajes       enable row level security;

-- Perfiles: todos los de la familia ven nombres (para poder compartir), cada uno edita el suyo
drop policy if exists "ver perfiles"   on public.perfiles;
drop policy if exists "mi perfil"      on public.perfiles;
drop policy if exists "editar perfil"  on public.perfiles;
create policy "ver perfiles"  on public.perfiles for select to authenticated using (true);
create policy "mi perfil"     on public.perfiles for insert to authenticated with check (user_id = auth.uid());
create policy "editar perfil" on public.perfiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Viajes: el dueño todo; los compartidos se ven y se editan, pero solo el dueño los borra
drop policy if exists "solo lo mio"       on public.viajes;
drop policy if exists "ver viajes"        on public.viajes;
drop policy if exists "crear viajes"      on public.viajes;
drop policy if exists "editar viajes"     on public.viajes;
drop policy if exists "borrar viajes"     on public.viajes;
create policy "ver viajes"    on public.viajes for select to authenticated using (user_id = auth.uid() or public.puedo_ver_viaje(id));
create policy "crear viajes"  on public.viajes for insert to authenticated with check (user_id = auth.uid());
create policy "editar viajes" on public.viajes for update to authenticated using (public.puedo_ver_viaje(id)) with check (true);
create policy "borrar viajes" on public.viajes for delete to authenticated using (user_id = auth.uid());

-- Que nadie pueda "robar" un viaje cambiando su dueño
create or replace function public.mantener_duenio() returns trigger language plpgsql as $$
begin
  new.user_id := old.user_id;
  return new;
end; $$;
drop trigger if exists mantener_duenio on public.viajes;
create trigger mantener_duenio before update on public.viajes for each row execute function public.mantener_duenio();

-- Miembros: los ven los del viaje; solo el dueño añade/quita; cada uno puede salirse
drop policy if exists "ver miembros"    on public.viaje_miembros;
drop policy if exists "poner miembros"  on public.viaje_miembros;
drop policy if exists "quitar miembros" on public.viaje_miembros;
create policy "ver miembros"    on public.viaje_miembros for select to authenticated using (public.puedo_ver_viaje(viaje_id));
create policy "poner miembros"  on public.viaje_miembros for insert to authenticated with check (public.soy_duenio_viaje(viaje_id));
create policy "quitar miembros" on public.viaje_miembros for delete to authenticated using (public.soy_duenio_viaje(viaje_id) or user_id = auth.uid());

-- Fotos: se ven si puedes ver el viaje; subes las tuyas; borras las tuyas (o todas si el viaje es tuyo)
drop policy if exists "solo lo mio"   on public.fotos;
drop policy if exists "ver fotos"     on public.fotos;
drop policy if exists "subir fotos"   on public.fotos;
drop policy if exists "editar fotos"  on public.fotos;
drop policy if exists "borrar fotos"  on public.fotos;
create policy "ver fotos"    on public.fotos for select to authenticated using (public.puedo_ver_viaje(viaje_id));
create policy "subir fotos"  on public.fotos for insert to authenticated with check (user_id = auth.uid() and public.puedo_ver_viaje(viaje_id));
create policy "editar fotos" on public.fotos for update to authenticated using (public.puedo_ver_viaje(viaje_id)) with check (public.puedo_ver_viaje(viaje_id));
create policy "borrar fotos" on public.fotos for delete to authenticated using (user_id = auth.uid() or public.soy_duenio_viaje(viaje_id));

-- Sueños y ajustes: siempre privados
drop policy if exists "solo lo mio" on public.deseos;
drop policy if exists "solo lo mio" on public.ajustes;
create policy "solo lo mio" on public.deseos  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "solo lo mio" on public.ajustes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Mensajes: los ve quien los escribe y a quien van; el destinatario solo puede marcarlos como vistos
drop policy if exists "ver mensajes"    on public.mensajes;
drop policy if exists "escribir mensajes" on public.mensajes;
drop policy if exists "marcar mensajes" on public.mensajes;
drop policy if exists "borrar mensajes" on public.mensajes;
create policy "ver mensajes"      on public.mensajes for select to authenticated using (para = auth.uid() or autor = auth.uid());
create policy "escribir mensajes" on public.mensajes for insert to authenticated with check (autor = auth.uid());
create policy "marcar mensajes"   on public.mensajes for update to authenticated using (para = auth.uid() or autor = auth.uid()) with check (para = auth.uid() or autor = auth.uid());
create policy "borrar mensajes"   on public.mensajes for delete to authenticated using (autor = auth.uid());

-- ---------- Archivos (fotos, audios, reservas): carpeta privada ----------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

drop policy if exists "fotos propias leer"   on storage.objects;
drop policy if exists "fotos propias subir"  on storage.objects;
drop policy if exists "fotos propias borrar" on storage.objects;
drop policy if exists "fotos leer"           on storage.objects;
drop policy if exists "fotos subir"          on storage.objects;
drop policy if exists "fotos borrar"         on storage.objects;
create policy "fotos leer" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and public.puedo_ver_ruta(name));
create policy "fotos subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text and public.puedo_ver_ruta(name));
create policy "fotos borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and ((storage.foldername(name))[1] = auth.uid()::text
         or public.soy_duenio_viaje(nullif(split_part(name, '/', 2), '')::uuid)));

-- ---------- Mapa compartido por enlace (solo lectura, sin fotos) ----------
create or replace function public.mapa_compartido(t text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'viajes', coalesce((
      select json_agg(json_build_object(
        'pais', v.pais, 'ciudad', v.ciudad, 'lat', v.lat, 'lon', v.lon,
        'inicio', v.inicio, 'fin', v.fin, 'sola', v.sola,
        'diario', case when a.compartir_diario then v.diario else null end
      ) order by v.inicio desc nulls last)
      from viajes v where v.user_id = a.user_id), '[]'::json),
    'deseos', coalesce((
      select json_agg(json_build_object('pais', d.pais, 'ciudad', d.ciudad, 'lat', d.lat, 'lon', d.lon, 'fecha', d.fecha))
      from deseos d where d.user_id = a.user_id), '[]'::json)
  )
  from ajustes a
  where a.token = t and a.compartir
  limit 1;
$$;
grant execute on function public.mapa_compartido(text) to anon, authenticated;

-- ---------- Latido (lo usa la tarea automática de GitHub) ----------
create or replace function public.latido()
returns timestamptz language sql as $$ select now(); $$;
grant execute on function public.latido() to anon, authenticated;
