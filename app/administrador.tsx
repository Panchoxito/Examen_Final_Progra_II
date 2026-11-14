import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colores } from '../estilos/colores';
import { supabase } from '../servicios/supabase';
import {
  obtenerPerfilUsuarioActual,
  obtenerSolicitudesPendientes,
  obtenerPrestamosActivos,
  obtenerHistorialPrestamos,
  aprobarPrestamo,
  rechazarPrestamo,
  devolverEquipo,
  obtenerReporteEquiposMasSolicitados,
} from '../servicios/prestamos';
import type { Usuario } from '../tipos/usuario';
import type { PrestamoConRelaciones } from '../tipos/prestamo';
import type { EquipoMasSolicitado } from '../tipos/equipo';

type SeccionAdministrador = 'pendientes' | 'activos' | 'historial' | 'reportes';

export default function PantallaAdministrador() {
  const enrutador = useRouter();
  const [seccionActiva, establecerSeccionActiva] = useState<SeccionAdministrador>('pendientes');
  const [perfilAdministrador, establecerPerfilAdministrador] = useState<Usuario | null>(null);
  const [solicitudesPendientes, establecerSolicitudesPendientes] = useState<PrestamoConRelaciones[]>([]);
  const [prestamosActivos, establecerPrestamosActivos] = useState<PrestamoConRelaciones[]>([]);
  const [historialPrestamos, establecerHistorialPrestamos] = useState<PrestamoConRelaciones[]>([]);
  const [reporteEquipos, establecerReporteEquipos] = useState<EquipoMasSolicitado[]>([]);
  const [cargando, establecerCargando] = useState<boolean>(true);
  const [actualizando, establecerActualizando] = useState<boolean>(false);
  const [idPrestamoProcesando, establecerIdPrestamoProcesando] = useState<number | null>(null);

  const cargarDatos = useCallback(async (): Promise<void> => {
    try {
      const { data: datosSesion } = await supabase.auth.getSession();
      if (!datosSesion.session) {
        enrutador.replace('/');
        return;
      }
      const perfil = await obtenerPerfilUsuarioActual();
      if (!perfil || perfil.rol !== 'administrador') {
        enrutador.replace('/estudiante');
        return;
      }
      establecerPerfilAdministrador(perfil);
      const [pendientes, activos, historial, reporte] = await Promise.all([
        obtenerSolicitudesPendientes(),
        obtenerPrestamosActivos(),
        obtenerHistorialPrestamos(),
        obtenerReporteEquiposMasSolicitados(),
      ]);
      establecerSolicitudesPendientes(pendientes);
      establecerPrestamosActivos(activos);
      establecerHistorialPrestamos(historial);
      establecerReporteEquipos(reporte);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo cargar la información del administrador.';
      Alert.alert('Error de conexión', mensaje);
    } finally {
      establecerCargando(false);
      establecerActualizando(false);
    }
  }, [enrutador]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const alActualizar = async (): Promise<void> => {
    establecerActualizando(true);
    await cargarDatos();
  };

  const cerrarSesion = async (): Promise<void> => {
    await supabase.auth.signOut();
    enrutador.replace('/');
  };

  const formatearFecha = (valor: string | null): string => {
    if (!valor) return 'Sin fecha';
    return new Date(valor).toLocaleString();
  };

  const manejarAprobacion = async (idPrestamo: number): Promise<void> => {
    if (idPrestamoProcesando !== null) return;
    establecerIdPrestamoProcesando(idPrestamo);
    try {
      await aprobarPrestamo(idPrestamo);
      Alert.alert('Solicitud aprobada', 'El préstamo fue aprobado correctamente.');
      await cargarDatos();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo aprobar la solicitud.';
      Alert.alert('Error al aprobar', mensaje);
    } finally {
      establecerIdPrestamoProcesando(null);
    }
  };

  const manejarRechazo = async (idPrestamo: number): Promise<void> => {
    if (idPrestamoProcesando !== null) return;
    establecerIdPrestamoProcesando(idPrestamo);
    try {
      await rechazarPrestamo(idPrestamo);
      Alert.alert('Solicitud rechazada', 'El préstamo fue rechazado correctamente.');
      await cargarDatos();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo rechazar la solicitud.';
      Alert.alert('Error al rechazar', mensaje);
    } finally {
      establecerIdPrestamoProcesando(null);
    }
  };

  const manejarDevolucion = async (idPrestamo: number): Promise<void> => {
    if (idPrestamoProcesando !== null) return;
    establecerIdPrestamoProcesando(idPrestamo);
    try {
      await devolverEquipo(idPrestamo);
      Alert.alert('Devolución registrada', 'El equipo fue marcado como devuelto.');
      await cargarDatos();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo registrar la devolución.';
      Alert.alert('Error al devolver', mensaje);
    } finally {
      establecerIdPrestamoProcesando(null);
    }
  };

  const contenido = useMemo(() => {
    if (cargando) {
      return (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.azul} />
          <Text style={estilos.textoSuave}>Cargando información...</Text>
        </View>
      );
    }

    if (seccionActiva === 'pendientes') {
      return (
        <View>
          <Text style={estilos.tituloSeccion}>Solicitudes pendientes</Text>
          {solicitudesPendientes.length === 0 ? (
            <Text style={estilos.textoVacio}>No hay solicitudes pendientes en este momento.</Text>
          ) : (
            solicitudesPendientes.map((prestamo) => {
              const procesando = idPrestamoProcesando === prestamo.id;
              return (
                <View key={prestamo.id} style={estilos.tarjeta}>
                  <Text style={estilos.nombrePrincipal}>{prestamo.equipos?.nombre ?? 'Equipo'}</Text>
                  <Text style={estilos.detalle}>Estudiante: <Text style={estilos.valorDetalle}>{prestamo.usuarios?.nombre_completo ?? 'No disponible'}</Text></Text>
                  <Text style={estilos.detalle}>Carné: <Text style={estilos.valorDetalle}>{prestamo.usuarios?.carne_universitario ?? 'No disponible'}</Text></Text>
                  <Text style={estilos.detalle}>Fecha de préstamo: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_prestamo)}</Text></Text>
                  <Text style={estilos.detalle}>Fecha de devolución: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_devolucion)}</Text></Text>
                  <Text style={estilos.detalle}>Estado: <Text style={estilos.valorDetalle}>{prestamo.estado}</Text></Text>
                  <View style={estilos.filaBotones}>
                    <TouchableOpacity
                      style={[estilos.botonAprobar, (procesando || idPrestamoProcesando !== null) && estilos.botonDeshabilitado]}
                      onPress={() => manejarAprobacion(prestamo.id)}
                      disabled={procesando || idPrestamoProcesando !== null}
                    >
                      {procesando ? <ActivityIndicator color={colores.blanco} /> : <Text style={estilos.textoBoton}>Aprobar</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[estilos.botonRechazar, (procesando || idPrestamoProcesando !== null) && estilos.botonDeshabilitado]}
                      onPress={() => manejarRechazo(prestamo.id)}
                      disabled={procesando || idPrestamoProcesando !== null}
                    >
                      <Text style={estilos.textoBoton}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      );
    }

    if (seccionActiva === 'activos') {
      return (
        <View>
          <Text style={estilos.tituloSeccion}>Préstamos activos</Text>
          {prestamosActivos.length === 0 ? (
            <Text style={estilos.textoVacio}>No hay préstamos activos en este momento.</Text>
          ) : (
            prestamosActivos.map((prestamo) => {
              const procesando = idPrestamoProcesando === prestamo.id;
              return (
                <View key={prestamo.id} style={estilos.tarjeta}>
                  <Text style={estilos.nombrePrincipal}>{prestamo.equipos?.nombre ?? 'Equipo'}</Text>
                  <Text style={estilos.detalle}>Estudiante: <Text style={estilos.valorDetalle}>{prestamo.usuarios?.nombre_completo ?? 'No disponible'}</Text></Text>
                  <Text style={estilos.detalle}>Carné: <Text style={estilos.valorDetalle}>{prestamo.usuarios?.carne_universitario ?? 'No disponible'}</Text></Text>
                  <Text style={estilos.detalle}>Fecha de préstamo: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_prestamo)}</Text></Text>
                  <Text style={estilos.detalle}>Fecha de devolución: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_devolucion)}</Text></Text>
                  <TouchableOpacity
                    style={[estilos.botonDevolver, (procesando || idPrestamoProcesando !== null) && estilos.botonDeshabilitado]}
                    onPress={() => manejarDevolucion(prestamo.id)}
                    disabled={procesando || idPrestamoProcesando !== null}
                  >
                    {procesando ? <ActivityIndicator color={colores.azulOscuro} /> : <Text style={estilos.textoBotonOscuro}>Marcar como devuelto</Text>}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      );
    }

    if (seccionActiva === 'historial') {
      return (
        <View>
          <Text style={estilos.tituloSeccion}>Historial de préstamos</Text>
          {historialPrestamos.length === 0 ? (
            <Text style={estilos.textoVacio}>No hay registros en el historial.</Text>
          ) : (
            historialPrestamos.map((prestamo) => (
              <View key={prestamo.id} style={estilos.tarjeta}>
                <Text style={estilos.nombrePrincipal}>{prestamo.equipos?.nombre ?? 'Equipo'}</Text>
                <Text style={estilos.detalle}>Estudiante: <Text style={estilos.valorDetalle}>{prestamo.usuarios?.nombre_completo ?? 'No disponible'}</Text></Text>
                <Text style={estilos.detalle}>Carné: <Text style={estilos.valorDetalle}>{prestamo.usuarios?.carne_universitario ?? 'No disponible'}</Text></Text>
                <Text style={estilos.detalle}>Estado: <Text style={estilos.valorDetalle}>{prestamo.estado}</Text></Text>
                <Text style={estilos.detalle}>Fecha de préstamo: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_prestamo)}</Text></Text>
                <Text style={estilos.detalle}>Fecha de devolución: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_devolucion)}</Text></Text>
                <Text style={estilos.detalle}>Devolución real: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_devolucion_real)}</Text></Text>
              </View>
            ))
          )}
        </View>
      );
    }

    return (
      <View>
        <Text style={estilos.tituloSeccion}>Reporte de equipos más solicitados</Text>
        {reporteEquipos.length === 0 ? (
          <Text style={estilos.textoVacio}>No hay datos para mostrar en el reporte.</Text>
        ) : (
          reporteEquipos.map((equipo, indice) => (
            <View key={equipo.id} style={estilos.tarjetaReporte}>
              <View style={estilos.indiceReporte}>
                <Text style={estilos.textoIndice}>{indice + 1}</Text>
              </View>
              <View style={estilos.infoReporte}>
                <Text style={estilos.nombrePrincipal}>{equipo.nombre}</Text>
                <Text style={estilos.detalle}>Cantidad de solicitudes: <Text style={estilos.valorDetalle}>{equipo.cantidad_solicitudes}</Text></Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  }, [cargando, seccionActiva, solicitudesPendientes, prestamosActivos, historialPrestamos, reporteEquipos, idPrestamoProcesando]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <View>
          <Text style={estilos.tituloEncabezado}>Panel del administrador</Text>
          <Text style={estilos.subtituloEncabezado}>{perfilAdministrador?.nombre_completo ?? ''}</Text>
        </View>
        <TouchableOpacity onPress={cerrarSesion}>
          <Text style={estilos.cerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.barraSecciones}>
        {([
          { clave: 'pendientes', etiqueta: 'Pendientes' },
          { clave: 'activos', etiqueta: 'Activos' },
          { clave: 'historial', etiqueta: 'Historial' },
          { clave: 'reportes', etiqueta: 'Reportes' },
        ] as { clave: SeccionAdministrador; etiqueta: string }[]).map((item) => (
          <TouchableOpacity
            key={item.clave}
            style={[estilos.botonSeccion, seccionActiva === item.clave && estilos.botonSeccionActiva]}
            onPress={() => establecerSeccionActiva(item.clave)}
          >
            <Text style={[estilos.textoSeccion, seccionActiva === item.clave && estilos.textoSeccionActiva]}>{item.etiqueta}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={estilos.contenido}
        refreshControl={<RefreshControl refreshing={actualizando} onRefresh={alActualizar} colors={[colores.azul]} />}
      >
        {contenido}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.grisClaro,
  },
  encabezado: {
    backgroundColor: colores.azul,
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloEncabezado: {
    color: colores.blanco,
    fontSize: 20,
    fontWeight: '700',
  },
  subtituloEncabezado: {
    color: colores.blanco,
    opacity: 0.9,
    marginTop: 2,
  },
  cerrarSesion: {
    color: colores.amarillo,
    fontWeight: '600',
  },
  barraSecciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: colores.blanco,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    gap: 8,
  },
  botonSeccion: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colores.grisClaro,
  },
  botonSeccionActiva: {
    backgroundColor: colores.celeste,
  },
  textoSeccion: {
    color: colores.azulOscuro,
    fontWeight: '600',
  },
  textoSeccionActiva: {
    color: colores.blanco,
  },
  contenido: {
    padding: 16,
    paddingBottom: 32,
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  textoSuave: {
    color: colores.textoSuave,
    marginTop: 8,
  },
  tituloSeccion: {
    fontSize: 20,
    fontWeight: '700',
    color: colores.azulOscuro,
    marginBottom: 10,
  },
  textoVacio: {
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: 20,
  },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombrePrincipal: {
    fontSize: 17,
    fontWeight: '700',
    color: colores.azulOscuro,
    marginBottom: 6,
  },
  detalle: {
    color: colores.textoSuave,
    marginTop: 2,
  },
  valorDetalle: {
    color: colores.texto,
    fontWeight: '600',
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  botonAprobar: {
    flex: 1,
    backgroundColor: colores.azul,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonRechazar: {
    flex: 1,
    backgroundColor: colores.peligro,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonDevolver: {
    marginTop: 12,
    backgroundColor: colores.amarillo,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: colores.blanco,
    fontWeight: '700',
  },
  textoBotonOscuro: {
    color: colores.azulOscuro,
    fontWeight: '700',
  },
  tarjetaReporte: {
    backgroundColor: colores.blanco,
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colores.borde,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indiceReporte: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colores.celeste,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textoIndice: {
    color: colores.blanco,
    fontWeight: '700',
  },
  infoReporte: {
    flex: 1,
  },
});
