import type { Equipo } from './equipo';
import type { Usuario } from './usuario';

export type EstadoPrestamo = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Devuelto';

export interface Prestamo {
  id: number;
  usuario_id: string;
  equipo_id: number;
  fecha_prestamo: string;
  fecha_devolucion: string;
  fecha_devolucion_real: string | null;
  estado: EstadoPrestamo;
  fecha_registro: string;
}

export interface PrestamoConEquipo extends Prestamo {
  equipos?: Pick<Equipo, 'id' | 'nombre' | 'imagen' | 'descripcion'> | null;
}

export interface PrestamoConRelaciones extends Prestamo {
  equipos?: Pick<Equipo, 'id' | 'nombre' | 'imagen' | 'descripcion'> | null;
  usuarios?: Pick<Usuario, 'id' | 'nombre_completo' | 'carne_universitario' | 'correo'> | null;
}
