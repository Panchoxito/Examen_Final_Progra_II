-- 04_almacenamiento.sql
-- Buckets y políticas de almacenamiento

-- Crear buckets
insert into storage.buckets (id, name, public)
values ('fotos_estudiantes', 'fotos_estudiantes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('imagenes_equipos', 'imagenes_equipos', true)
on conflict (id) do nothing;

-- Políticas para fotos_estudiantes (privado)
drop policy if exists fotos_estudiantes_insertar_propia on storage.objects;
drop policy if exists fotos_estudiantes_ver_propia on storage.objects;
drop policy if exists fotos_estudiantes_actualizar_propia on storage.objects;
drop policy if exists fotos_estudiantes_eliminar_propia on storage.objects;
drop policy if exists fotos_estudiantes_ver_admin on storage.objects;

-- Ruta esperada: <auth.uid()>/nombre_archivo
create policy fotos_estudiantes_insertar_propia
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fotos_estudiantes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy fotos_estudiantes_ver_propia
on storage.objects
for select
to authenticated
using (
  bucket_id = 'fotos_estudiantes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy fotos_estudiantes_actualizar_propia
on storage.objects
for update
to authenticated
using (
  bucket_id = 'fotos_estudiantes'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'fotos_estudiantes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy fotos_estudiantes_eliminar_propia
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fotos_estudiantes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy fotos_estudiantes_ver_admin
on storage.objects
for select
to authenticated
using (
  bucket_id = 'fotos_estudiantes'
  and public.es_administrador(auth.uid())
);

-- Políticas para imagenes_equipos
drop policy if exists imagenes_equipos_ver_autenticados on storage.objects;
drop policy if exists imagenes_equipos_ver_publico on storage.objects;

-- Bucket público: lectura pública para facilitar visualización en la app
create policy imagenes_equipos_ver_publico
on storage.objects
for select
to public
using (bucket_id = 'imagenes_equipos');

-- Escritura/modificación restringida (no se otorgan políticas de insert/update/delete a authenticated)
-- Las imágenes iniciales pueden cargarse desde el panel de Supabase Storage por un administrador del proyecto.
