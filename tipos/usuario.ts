export type RolUsuario = 'estudiante' | 'administrador';

export interface Usuario {
  id: string;
  nombre_completo: string;
  carne_universitario: string | null;
  carrera: string | null;
  foto: string | null;
  correo: string | null;
  rol: RolUsuario;
  fecha_registro: string;
}

export interface DatosRegistroEstudiante {
  nombreCompleto: string;
  carneUniversitario: string;
  carrera: string;
  correo: string;
  contrasena: string;
  confirmacionContrasena: string;
  uriFotografia: string;
  tipoMimeFotografia: string;
}
