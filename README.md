# Sistema de Gestión de Equipos de Laboratorio

Aplicación móvil desarrollada con React Native, Expo y TypeScript para la gestión de préstamos de equipos de laboratorio. Utiliza Supabase (PostgreSQL, Auth, Storage y funciones RPC) como backend.

## Requisitos previos

- Node.js y npm instalados
- Expo Go en un teléfono Android (o emulador configurado)
- Acceso al proyecto de Supabase indicado

## Configuración de Supabase

1. Crea o edita el archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://pqhbedzrnndrolotmuvu.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_cTSRZfh34mCL2SswtubMiw_nrF8C00S
```

2. Asegúrate de que en Supabase ya se hayan ejecutado los scripts SQL proporcionados en la carpeta `supabase/` (tablas, funciones, políticas, almacenamiento y datos iniciales), según corresponda y sin duplicar información existente.

3. Para el acceso administrativo, el usuario administrador debe existir previamente en Supabase Auth y tener su perfil en la tabla `usuarios` con `rol = 'administrador'` (configurado de forma segura fuera de la aplicación).

## Instalación

Desde la carpeta del proyecto ejecuta:

```bash
npm install
```

## Ejecución con Expo

Inicia el servidor de desarrollo con:

```bash
npx expo start
```

Luego escanea el código QR con Expo Go en Android.

## Verificación de TypeScript

Para comprobar el tipado del proyecto:

```bash
npx tsc --noEmit
```

## Uso básico

### Estudiante
- Registrarse desde la pantalla de bienvenida (nombre completo, carné, carrera, fotografía, correo y contraseña).
- Si Supabase solicita confirmación de correo, confirmar el correo antes de iniciar sesión para operaciones autenticadas.
- Iniciar sesión para acceder al panel estudiantil.
- Consultar el catálogo de equipos, solicitar equipos disponibles y revisar el estado en "Mis préstamos".
- Consultar su perfil (fotografía, nombre, carné, carrera y correo).

### Administrador
- Iniciar sesión con una cuenta que tenga rol `administrador` en la tabla `usuarios`.
- Revisar solicitudes pendientes y aprobar o rechazar mediante las funciones de PostgreSQL.
- Consultar préstamos activos y marcar devoluciones.
- Revisar el historial completo y el reporte de equipos más solicitados.

## Estructura principal

- `app/`: pantallas y rutas de Expo Router (TSX)
- `componentes/`: componentes visuales reutilizables
- `servicios/`: conexión con Supabase y operaciones de negocio
- `tipos/`: definiciones de tipos e interfaces TypeScript
- `estilos/`: colores y estilos compartidos
- `supabase/`: scripts SQL proporcionados
- `assets/`: recursos estáticos de la aplicación

## Notas importantes

- Las operaciones de préstamo (solicitar, aprobar, rechazar, devolver y reporte) se realizan mediante funciones RPC de PostgreSQL definidas en `supabase/02_funciones.sql`.
- No se modifica el estado de préstamos ni la disponibilidad de equipos directamente desde la interfaz.
- Las fotografías de estudiantes se almacenan en el bucket privado `fotos_estudiantes` y las imágenes de equipos en el bucket público `imagenes_equipos`.
