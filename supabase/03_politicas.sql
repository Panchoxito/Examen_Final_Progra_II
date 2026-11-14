-- 03_politicas.sql
-- Row Level Security y protección de permisos

-- Habilitar RLS
alter table public.usuarios enable row level security;
alter table public.equipos enable row level security;
alter table public.prestamos enable row level security;

-- Limpiar políticas si existen (para re-ejecución controlada)
drop policy if exists usuarios_ver_perfil_propio on public.usuarios;
drop policy if exists usuarios_ver_admin on public.usuarios;
drop policy if exists usuarios_insertar_perfil_propio on public.usuarios;
drop policy if exists usuarios_actualizar_perfil_propio on public.usuarios;
drop policy if exists equipos_ver_autenticados on public.equipos;
drop policy if exists prestamos_ver_propios on public.prestamos;
drop policy if exists prestamos_ver_admin on public.prestamos;
drop policy if exists prestamos_insertar_estudiante on public.prestamos;

-- USUARIOS
-- Un estudiante puede consultar su propio perfil
create policy usuarios_ver_perfil_propio
on public.usuarios
for select
to authenticated
using (id = auth.uid());

-- Un administrador puede consultar información de usuarios
create policy usuarios_ver_admin
on public.usuarios
for select
to authenticated
using (public.es_administrador(auth.uid()));

-- Permitir inserción del propio perfil (respaldo; normalmente lo crea el trigger)
create policy usuarios_insertar_perfil_propio
on public.usuarios
for insert
to authenticated
with check (id = auth.uid() and rol = 'estudiante');

-- Permitir actualización limitada del propio perfil (sin cambiar rol ni id)
create policy usuarios_actualizar_perfil_propio
on public.usuarios
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and rol = 'estudiante');

-- Proteger columnas sensibles: ningún usuario autenticado puede cambiar rol o id directamente
revoke update (rol, id) on public.usuarios from authenticated;

-- EQUIPOS
-- Usuarios autenticados pueden consultar equipos
create policy equipos_ver_autenticados
on public.equipos
for select
to authenticated
using (true);

-- No se otorgan permisos de escritura directa a authenticated sobre equipos
revoke insert, update, delete on public.equipos from authenticated;
revoke insert, update, delete on public.equipos from anon;

-- PRESTAMOS
-- Un estudiante solo puede consultar sus préstamos
create policy prestamos_ver_propios
on public.prestamos
for select
to authenticated
using (usuario_id = auth.uid());

-- Un administrador puede consultar todos los préstamos
create policy prestamos_ver_admin
on public.prestamos
for select
to authenticated
using (public.es_administrador(auth.uid()));

-- No permitir modificaciones directas de préstamos/estados desde el cliente
revoke insert, update, delete on public.prestamos from authenticated;
revoke insert, update, delete on public.prestamos from anon;

-- Revocar acceso anónimo a tablas
revoke all on public.usuarios from anon;
revoke all on public.equipos from anon;
revoke all on public.prestamos from anon;

-- Permitir uso básico de secuencias si fuera necesario (identities las gestionan internamente)
grant select on public.usuarios, public.equipos, public.prestamos to authenticated;
