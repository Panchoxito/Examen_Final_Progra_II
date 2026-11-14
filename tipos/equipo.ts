export interface Equipo {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string | null;
  disponible: boolean;
  fecha_registro: string;
}

export interface EquipoMasSolicitado {
  id: number;
  nombre: string;
  cantidad_solicitudes: number;
}
