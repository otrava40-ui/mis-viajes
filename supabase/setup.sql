-- =====================================================================
--  MIS VIAJES · Preparación de la base de datos en Supabase
--  Pega TODO este archivo en Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- Tablas ----------
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

create table if not exists public.fotos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  viaje_id   uuid not null references public.viajes on delete cascade,
  ruta       text not null,
  miniatura  text,
  instax     boolean not null default false,
  billete    boolean not null default false,
  audio      boolean not null default false,
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

-- Por si la base de datos se creó con una versión anterior
alter table public.viajes  add column if not exists extra   jsonb not null default '{}'::jsonb;
alter table public.deseos  add column if not exists extra   jsonb not null default '{}'::jsonb;
alter table public.ajustes add column if not exists extra   jsonb not null default '{}'::jsonb;
alter table public.fotos   add column if not exists billete boolean not null default false;
alter table public.fotos   add column if not exists audio   boolean not null default false;
alter table public.fotos   alter column miniatura drop not null;

create index if not exists viajes_user on public.viajes(user_id);
create index if not exists fotos_viaje on public.fotos(viaje_id);
create index if not exists deseos_user on public.deseos(user_id);

-- ---------- Seguridad: cada persona solo ve lo suyo ----------
alter table public.viajes  enable row level security;
alter table public.fotos   enable row level security;
alter table public.deseos  enable row level security;
alter table public.ajustes enable row level security;

drop policy if exists "solo lo mio" on public.viajes;
drop policy if exists "solo lo mio" on public.fotos;
drop policy if exists "solo lo mio" on public.deseos;
drop policy if exists "solo lo mio" on public.ajustes;
create policy "solo lo mio" on public.viajes  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "solo lo mio" on public.fotos   for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "solo lo mio" on public.deseos  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "solo lo mio" on public.ajustes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Fotos: carpeta privada ----------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

drop policy if exists "fotos propias leer"   on storage.objects;
drop policy if exists "fotos propias subir"  on storage.objects;
drop policy if exists "fotos propias borrar" on storage.objects;
create policy "fotos propias leer" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos propias subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos propias borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Mapa compartido (solo lectura, sin fotos) ----------
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
