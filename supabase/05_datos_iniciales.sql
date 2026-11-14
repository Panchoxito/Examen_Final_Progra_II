-- 05_datos_iniciales.sql
-- Datos iniciales: equipos de laboratorio
-- No inserta usuarios ni préstamos. El administrador debe crearse de forma segura según README.

insert into public.equipos (nombre, descripcion, imagen, disponible)
select * from (values
  ('Microscopio', 'Microscopio óptico para prácticas de biología y análisis de muestras.', 'equipos/microscopio.svg', true),
  ('Multímetro digital', 'Instrumento para medir voltaje, corriente y resistencia en circuitos.', 'equipos/multimetro.svg', true),
  ('Osciloscopio', 'Equipo para visualizar señales eléctricas y analizar su comportamiento.', 'equipos/osciloscopio.svg', true),
  ('Fuente de alimentación', 'Fuente regulable para alimentar circuitos electrónicos en laboratorio.', 'equipos/fuente.svg', true),
  ('Kit de electrónica', 'Conjunto de componentes básicos para prácticas de circuitos y prototipos.', 'equipos/kit.svg', true),
  ('Proyector', 'Proyector para presentaciones y demostraciones en el laboratorio.', 'equipos/proyector.svg', true),
  ('Balanza digital', 'Balanza de precisión para medición de masa en experimentos.', 'equipos/balanza.svg', true)
) as datos(nombre, descripcion, imagen, disponible)
where not exists (select 1 from public.equipos);

-- Nota: las imágenes referenciadas deben cargarse al bucket "imagenes_equipos" en la ruta indicada
-- (por ejemplo equipos/microscopio.svg) desde el panel de Supabase Storage si se desea mostrarlas desde Storage.
-- También se incluyen copias SVG en servidor/archivos/equipos/ dentro del repositorio.
