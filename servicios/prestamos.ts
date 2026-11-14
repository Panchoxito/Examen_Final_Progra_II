import { supabase } from './supabase';
import type { Equipo, EquipoMasSolicitado } from '../tipos/equipo';
import type { Prestamo, PrestamoConEquipo, PrestamoConRelaciones } from '../tipos/prestamo';
import type { Usuario } from '../tipos/usuario';

export const obtenerPerfilUsuarioActual = async (): Promise<Usuario | null> => {
  const { data: datosSesion } = await supabase.auth.getSession();
  const idUsuario = datosSesion.session?.user.id;
  if (!idUsuario) return null;

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', idUsuario)
    .single();

  if (error) return null;
  return data as Usuario;
};

export const obtenerEquipos = async (): Promise<Equipo[]> => {
  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Equipo[];
};

export const solicitarPrestamo = async (idEquipo: number): Promise<Prestamo> => {
  const { data, error } = await supabase.rpc('solicitar_prestamo', {
    p_equipo_id: idEquipo,
  });
  if (error) throw error;
  return data as Prestamo;
};

export const obtenerMisPrestamos = async (): Promise<PrestamoConEquipo[]> => {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*, equipos(id, nombre, imagen, descripcion)')
    .order('fecha_registro', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PrestamoConEquipo[];
};

export const obtenerSolicitudesPendientes = async (): Promise<PrestamoConRelaciones[]> => {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*, equipos(id, nombre, imagen, descripcion), usuarios(id, nombre_completo, carne_universitario, correo)')
    .eq('estado', 'Pendiente')
    .order('fecha_registro', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PrestamoConRelaciones[];
};

export const obtenerPrestamosActivos = async (): Promise<PrestamoConRelaciones[]> => {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*, equipos(id, nombre, imagen, descripcion), usuarios(id, nombre_completo, carne_universitario, correo)')
    .eq('estado', 'Aprobado')
    .order('fecha_prestamo', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PrestamoConRelaciones[];
};

export const obtenerHistorialPrestamos = async (): Promise<PrestamoConRelaciones[]> => {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*, equipos(id, nombre, imagen, descripcion), usuarios(id, nombre_completo, carne_universitario, correo)')
    .order('fecha_registro', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PrestamoConRelaciones[];
};

export const aprobarPrestamo = async (idPrestamo: number): Promise<Prestamo> => {
  const { data, error } = await supabase.rpc('aprobar_prestamo', {
    p_prestamo_id: idPrestamo,
  });
  if (error) throw error;
  return data as Prestamo;
};

export const rechazarPrestamo = async (idPrestamo: number): Promise<Prestamo> => {
  const { data, error } = await supabase.rpc('rechazar_prestamo', {
    p_prestamo_id: idPrestamo,
  });
  if (error) throw error;
  return data as Prestamo;
};

export const devolverEquipo = async (idPrestamo: number): Promise<Prestamo> => {
  const { data, error } = await supabase.rpc('devolver_equipo', {
    p_prestamo_id: idPrestamo,
  });
  if (error) throw error;
  return data as Prestamo;
};

export const obtenerReporteEquiposMasSolicitados = async (): Promise<EquipoMasSolicitado[]> => {
  const { data, error } = await supabase.rpc('reporte_equipos_mas_solicitados');
  if (error) throw error;
  return (data ?? []) as EquipoMasSolicitado[];
};
