-- 01_tablas.sql
-- Tablas principales para el Sistema de Gestión de Equipos de Laboratorio
-- Ejecutar en Supabase SQL Editor. Revisa datos existentes antes de ejecutar.

create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  carne_universitario text,
  carrera text,
  foto text,
  correo text,
  rol text not null default 'estudiante' check (rol in ('estudiante', 'administrador')),
  fecha_registro timestamptz not null default now()
);

-- Carné único cuando no es nulo (permite administradores sin carné)
create unique index if not exists usuarios_carne_universitario_unico
  on public.usuarios (carne_universitario)
  where carne_universitario is not null;

create table if not exists public.equipos (
  id bigint primary key generated always as identity,
  nombre text not null,
  descripcion text not null,
  imagen text,
  disponible boolean not null default true,
  fecha_registro timestamptz not null default now()
);

create table if not exists public.prestamos (
  id bigint primary key generated always as identity,
  usuario_id uuid not null references public.usuarios(id) on delete restrict,
  equipo_id bigint not null references public.equipos(id) on delete restrict,
  fecha_prestamo timestamptz not null,
  fecha_devolucion timestamptz not null,
  fecha_devolucion_real timestamptz,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'Aprobado', 'Rechazado', 'Devuelto')),
  fecha_registro timestamptz not null default now(),
  constraint prestamos_fechas_validas check (fecha_devolucion > fecha_prestamo),
  constraint prestamos_devolucion_real_valida check (
    (estado = 'Devuelto' and fecha_devolucion_real is not null) or
    (estado <> 'Devuelto' and fecha_devolucion_real is null)
  )
);

-- Índices para consultas frecuentes
create index if not exists prestamos_usuario_id_idx on public.prestamos (usuario_id);
create index if not exists prestamos_equipo_id_idx on public.prestamos (equipo_id);
create index if not exists prestamos_estado_idx on public.prestamos (estado);

-- Evita más de un préstamo aprobado simultáneo por equipo
create unique index if not exists prestamos_equipo_aprobado_unico
  on public.prestamos (equipo_id)
  where estado = 'Aprobado';

-- Evita solicitudes pendientes duplicadas del mismo estudiante para el mismo equipo
create unique index if not exists prestamos_pendiente_usuario_equipo_unico
  on public.prestamos (usuario_id, equipo_id)
  where estado = 'Pendiente';

-- Trigger: crear perfil en public.usuarios al registrarse en auth.users
create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_completo_meta text;
  carne_meta text;
  carrera_meta text;
  foto_meta text;
begin
  nombre_completo_meta := coalesce(new.raw_user_meta_data ->> 'nombre_completo', '');
  carne_meta := nullif(new.raw_user_meta_data ->> 'carne_universitario', '');
  carrera_meta := nullif(new.raw_user_meta_data ->> 'carrera', '');
  foto_meta := nullif(new.raw_user_meta_data ->> 'foto', '');

  insert into public.usuarios (id, nombre_completo, carne_universitario, carrera, foto, correo, rol)
  values (
    new.id,
    nombre_completo_meta,
    carne_meta,
    carrera_meta,
    foto_meta,
    new.email,
    'estudiante'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists al_crear_usuario_auth on auth.users;
create trigger al_crear_usuario_auth
after insert on auth.users
for each row execute function public.crear_perfil_usuario();
