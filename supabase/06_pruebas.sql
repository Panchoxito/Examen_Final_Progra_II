-- 06_pruebas.sql
-- Consultas de verificación (ejecutar manualmente en SQL Editor según corresponda)
-- Algunas pruebas requieren ejecutar acciones desde la aplicación con usuarios autenticados.

-- 1) Verificar tablas
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('usuarios','equipos','prestamos');

-- 2) Verificar equipos iniciales (deben ser al menos 7)
select count(*) as total_equipos from public.equipos;

-- 3) Verificar restricción de estados
-- (debe fallar si se intenta un estado inválido)
-- insert into public.prestamos (usuario_id, equipo_id, fecha_prestamo, fecha_devolucion, estado)
-- values ('00000000-0000-0000-0000-000000000000', 1, now(), now() + interval '3 days', 'Otro');

-- 4) Verificar índice único parcial: solo un aprobado por equipo
-- select indexname from pg_indexes where tablename = 'prestamos';

-- 5) Verificar RLS habilitado
select relname, relrowsecurity from pg_class
where relname in ('usuarios','equipos','prestamos');

-- 6) Prueba de concurrencia/regla de negocio (realizar desde la app con dos estudiantes):
-- a. Dos estudiantes solicitan el mismo equipo (dos préstamos Pendiente, si no hay duplicado por mismo estudiante).
-- b. Administrador aprueba el primero mediante rpc aprobar_prestamo -> debe pasar.
-- c. Administrador intenta aprobar el segundo -> debe fallar con mensaje de equipo no disponible.
-- d. Administrador devuelve el primero mediante rpc devolver_equipo.
-- e. Administrador aprueba el segundo -> debe pasar.

-- 7) Verificar que un estudiante no pueda cambiar su rol/estado directamente (debe fallar por RLS/permisos)
-- update public.usuarios set rol = 'administrador' where id = auth.uid();
-- update public.prestamos set estado = 'Aprobado' where id = 1;

-- 8) Reporte
-- select * from public.reporte_equipos_mas_solicitados();
