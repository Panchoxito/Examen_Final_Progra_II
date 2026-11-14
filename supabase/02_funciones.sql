-- 02_funciones.sql
-- Funciones de negocio (RPC) para el Sistema de Gestión de Equipos de Laboratorio
-- Requiere que existan las tablas definidas en 01_tablas.sql

create or replace function public.es_administrador(p_usuario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = p_usuario_id and u.rol = 'administrador'
  );
$$;

create or replace function public.solicitar_prestamo(p_equipo_id bigint)
returns public.prestamos
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_actual_id uuid;
  rol_actual text;
  equipo_registro public.equipos%rowtype;
  prestamo_nuevo public.prestamos%rowtype;
  fecha_inicio timestamptz;
  fecha_fin timestamptz;
begin
  usuario_actual_id := auth.uid();
  if usuario_actual_id is null then
    raise exception 'Debe iniciar sesión para solicitar un préstamo.';
  end if;

  select rol into rol_actual from public.usuarios where id = usuario_actual_id;
  if rol_actual is distinct from 'estudiante' then
    raise exception 'Solo los estudiantes pueden solicitar préstamos.';
  end if;

  select * into equipo_registro from public.equipos where id = p_equipo_id;
  if not found then
    raise exception 'El equipo seleccionado no existe.';
  end if;

  if equipo_registro.disponible is not true then
    raise exception 'El equipo no está disponible actualmente.';
  end if;

  fecha_inicio := now();
  fecha_fin := fecha_inicio + interval '3 days';

  insert into public.prestamos (usuario_id, equipo_id, fecha_prestamo, fecha_devolucion, estado)
  values (usuario_actual_id, p_equipo_id, fecha_inicio, fecha_fin, 'Pendiente')
  returning * into prestamo_nuevo;

  return prestamo_nuevo;
exception
  when unique_violation then
    raise exception 'Ya existe una solicitud pendiente para este equipo.';
end;
$$;

create or replace function public.aprobar_prestamo(p_prestamo_id bigint)
returns public.prestamos
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_actual_id uuid;
  prestamo_registro public.prestamos%rowtype;
  equipo_registro public.equipos%rowtype;
begin
  usuario_actual_id := auth.uid();
  if usuario_actual_id is null then
    raise exception 'Debe iniciar sesión.';
  end if;
  if not public.es_administrador(usuario_actual_id) then
    raise exception 'No tiene permisos para aprobar préstamos.';
  end if;

  select * into prestamo_registro
  from public.prestamos
  where id = p_prestamo_id
  for update;

  if not found then
    raise exception 'La solicitud de préstamo no existe.';
  end if;
  if prestamo_registro.estado <> 'Pendiente' then
    raise exception 'Solo se pueden aprobar solicitudes pendientes.';
  end if;

  select * into equipo_registro
  from public.equipos
  where id = prestamo_registro.equipo_id
  for update;

  if not found then
    raise exception 'El equipo asociado no existe.';
  end if;
  if equipo_registro.disponible is not true then
    raise exception 'El equipo ya no está disponible. No se puede aprobar esta solicitud.';
  end if;

  update public.prestamos
  set estado = 'Aprobado'
  where id = p_prestamo_id
  returning * into prestamo_registro;

  update public.equipos
  set disponible = false
  where id = prestamo_registro.equipo_id;

  return prestamo_registro;
end;
$$;

create or replace function public.rechazar_prestamo(p_prestamo_id bigint)
returns public.prestamos
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_actual_id uuid;
  prestamo_registro public.prestamos%rowtype;
begin
  usuario_actual_id := auth.uid();
  if usuario_actual_id is null then
    raise exception 'Debe iniciar sesión.';
  end if;
  if not public.es_administrador(usuario_actual_id) then
    raise exception 'No tiene permisos para rechazar préstamos.';
  end if;

  select * into prestamo_registro
  from public.prestamos
  where id = p_prestamo_id
  for update;

  if not found then
    raise exception 'La solicitud de préstamo no existe.';
  end if;
  if prestamo_registro.estado <> 'Pendiente' then
    raise exception 'Solo se pueden rechazar solicitudes pendientes.';
  end if;

  update public.prestamos
  set estado = 'Rechazado'
  where id = p_prestamo_id
  returning * into prestamo_registro;

  return prestamo_registro;
end;
$$;

create or replace function public.devolver_equipo(p_prestamo_id bigint)
returns public.prestamos
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_actual_id uuid;
  prestamo_registro public.prestamos%rowtype;
begin
  usuario_actual_id := auth.uid();
  if usuario_actual_id is null then
    raise exception 'Debe iniciar sesión.';
  end if;
  if not public.es_administrador(usuario_actual_id) then
    raise exception 'No tiene permisos para registrar devoluciones.';
  end if;

  select * into prestamo_registro
  from public.prestamos
  where id = p_prestamo_id
  for update;

  if not found then
    raise exception 'El préstamo no existe.';
  end if;
  if prestamo_registro.estado <> 'Aprobado' then
    raise exception 'Solo se pueden devolver préstamos aprobados.';
  end if;

  update public.prestamos
  set estado = 'Devuelto',
      fecha_devolucion_real = now()
  where id = p_prestamo_id
  returning * into prestamo_registro;

  update public.equipos
  set disponible = true
  where id = prestamo_registro.equipo_id;

  return prestamo_registro;
end;
$$;

-- Función para reporte de equipos más solicitados
create or replace function public.reporte_equipos_mas_solicitados()
returns table (
  id bigint,
  nombre text,
  cantidad_solicitudes bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.nombre, count(p.id)::bigint as cantidad_solicitudes
  from public.equipos e
  left join public.prestamos p on p.equipo_id = e.id
  group by e.id, e.nombre
  order by cantidad_solicitudes desc, e.nombre asc;
$$;

-- Permisos de ejecución: solo usuarios autenticados (las funciones validan rol internamente)
revoke all on function public.es_administrador(uuid) from public;
revoke all on function public.solicitar_prestamo(bigint) from public;
revoke all on function public.aprobar_prestamo(bigint) from public;
revoke all on function public.rechazar_prestamo(bigint) from public;
revoke all on function public.devolver_equipo(bigint) from public;
revoke all on function public.reporte_equipos_mas_solicitados() from public;

grant execute on function public.solicitar_prestamo(bigint) to authenticated;
grant execute on function public.aprobar_prestamo(bigint) to authenticated;
grant execute on function public.rechazar_prestamo(bigint) to authenticated;
grant execute on function public.devolver_equipo(bigint) to authenticated;
grant execute on function public.reporte_equipos_mas_solicitados() to authenticated;
-- es_administrador se usa internamente; no es necesario exponerla
