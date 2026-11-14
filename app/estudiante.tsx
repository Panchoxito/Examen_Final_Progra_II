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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colores } from '../estilos/colores';
import { supabase, obtenerUrlFirmadaFotoEstudiante, obtenerUrlPublicaImagenEquipo } from '../servicios/supabase';
import {
  obtenerPerfilUsuarioActual,
  obtenerEquipos,
  solicitarPrestamo,
  obtenerMisPrestamos,
} from '../servicios/prestamos';
import type { Usuario } from '../tipos/usuario';
import type { Equipo } from '../tipos/equipo';
import type { PrestamoConEquipo } from '../tipos/prestamo';
import TarjetaEquipo from '../componentes/TarjetaEquipo';

type SeccionEstudiante = 'inicio' | 'catalogo' | 'prestamos' | 'perfil';

export default function PantallaEstudiante() {
  const enrutador = useRouter();
  const [seccionActiva, establecerSeccionActiva] = useState<SeccionEstudiante>('inicio');
  const [perfilUsuario, establecerPerfilUsuario] = useState<Usuario | null>(null);
  const [listaEquipos, establecerListaEquipos] = useState<Equipo[]>([]);
  const [listaPrestamos, establecerListaPrestamos] = useState<PrestamoConEquipo[]>([]);
  const [urlFotoPerfil, establecerUrlFotoPerfil] = useState<string | null>(null);
  const [cargando, establecerCargando] = useState<boolean>(true);
  const [actualizando, establecerActualizando] = useState<boolean>(false);
  const [idEquipoSolicitando, establecerIdEquipoSolicitando] = useState<number | null>(null);

  const cargarDatos = useCallback(async (): Promise<void> => {
    try {
      const { data: datosSesion } = await supabase.auth.getSession();
      if (!datosSesion.session) {
        enrutador.replace('/');
        return;
      }
      const perfil = await obtenerPerfilUsuarioActual();
      if (!perfil) {
        Alert.alert('Sesión', 'No se pudo cargar tu perfil.');
        enrutador.replace('/');
        return;
      }
      if (perfil.rol !== 'estudiante') {
        enrutador.replace('/administrador');
        return;
      }
      establecerPerfilUsuario(perfil);
      const [equipos, prestamos, urlFoto] = await Promise.all([
        obtenerEquipos(),
        obtenerMisPrestamos(),
        obtenerUrlFirmadaFotoEstudiante(perfil.foto),
      ]);
      establecerListaEquipos(equipos);
      establecerListaPrestamos(prestamos);
      establecerUrlFotoPerfil(urlFoto);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo cargar la información.';
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

  const manejarSolicitud = async (equipo: Equipo): Promise<void> => {
    if (!equipo.disponible || idEquipoSolicitando !== null) return;
    establecerIdEquipoSolicitando(equipo.id);
    try {
      await solicitarPrestamo(equipo.id);
      Alert.alert('Solicitud enviada', 'Tu solicitud de préstamo fue registrada como pendiente.');
      await cargarDatos();
      establecerSeccionActiva('prestamos');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo solicitar el préstamo.';
      Alert.alert('No se pudo solicitar', mensaje);
    } finally {
      establecerIdEquipoSolicitando(null);
    }
  };

  const formatearFecha = (valor: string | null): string => {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(valor);
    return fecha.toLocaleString();
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

    if (seccionActiva === 'inicio') {
      return (
        <View style={estilos.seccion}>
          <View style={estilos.tarjetaBienvenida}>
            <Text style={estilos.saludo}>Hola, {perfilUsuario?.nombre_completo ?? 'estudiante'}</Text>
            <Text style={estilos.mensajeBienvenida}>Bienvenido al sistema de gestión de equipos de laboratorio.</Text>
          </View>
          <View style={estilos.tarjetaOpcion}>
            <Text style={estilos.tituloOpcion}>Catálogo de equipos</Text>
            <Text style={estilos.descripcionOpcion}>Consulta los equipos disponibles y realiza solicitudes.</Text>
            <TouchableOpacity style={estilos.botonPequeno} onPress={() => establecerSeccionActiva('catalogo')}>
              <Text style={estilos.textoBoton}>Ver catálogo</Text>
            </TouchableOpacity>
          </View>
          <View style={estilos.tarjetaOpcion}>
            <Text style={estilos.tituloOpcion}>Mis préstamos</Text>
            <Text style={estilos.descripcionOpcion}>Revisa el estado de tus solicitudes y préstamos.</Text>
            <TouchableOpacity style={estilos.botonPequenoSecundario} onPress={() => establecerSeccionActiva('prestamos')}>
              <Text style={estilos.textoBoton}>Ver préstamos</Text>
            </TouchableOpacity>
          </View>
          <View style={estilos.tarjetaOpcion}>
            <Text style={estilos.tituloOpcion}>Mi información</Text>
            <Text style={estilos.descripcionOpcion}>Consulta tu perfil registrado en el sistema.</Text>
            <TouchableOpacity style={estilos.botonPequenoAmarillo} onPress={() => establecerSeccionActiva('perfil')}>
              <Text style={estilos.textoBotonOscuro}>Ver perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (seccionActiva === 'catalogo') {
      return (
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Catálogo de equipos</Text>
          {listaEquipos.length === 0 ? (
            <Text style={estilos.textoVacio}>Todavía no hay equipos registrados.</Text>
          ) : (
            listaEquipos.map((equipo) => {
              const urlImagen = obtenerUrlPublicaImagenEquipo(equipo.imagen);
              const solicitandoEste = idEquipoSolicitando === equipo.id;
              return (
                <TarjetaEquipo
                  key={equipo.id}
                  equipo={equipo}
                  urlImagen={urlImagen}
                  accion={
                    equipo.disponible ? (
                      <TouchableOpacity
                        style={[estilos.botonAccion, solicitandoEste && estilos.botonDeshabilitado]}
                        onPress={() => manejarSolicitud(equipo)}
                        disabled={solicitandoEste || idEquipoSolicitando !== null}
                      >
                        {solicitandoEste ? (
                          <ActivityIndicator color={colores.blanco} />
                        ) : (
                          <Text style={estilos.textoBoton}>Solicitar equipo</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={estilos.etiquetaNoDisponible}>
                        <Text style={estilos.textoNoDisponible}>Equipo no disponible para solicitud</Text>
                      </View>
                    )
                  }
                />
              );
            })
          )}
        </View>
      );
    }

    if (seccionActiva === 'prestamos') {
      return (
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Mis préstamos</Text>
          {listaPrestamos.length === 0 ? (
            <Text style={estilos.textoVacio}>Todavía no has realizado solicitudes de préstamo.</Text>
          ) : (
            listaPrestamos.map((prestamo) => (
              <View key={prestamo.id} style={estilos.tarjeta}>
                <Text style={estilos.nombreEquipo}>{prestamo.equipos?.nombre ?? 'Equipo'}</Text>
                <Text style={estilos.detalle}>Estado: <Text style={estilos.valorDetalle}>{prestamo.estado}</Text></Text>
                <Text style={estilos.detalle}>Fecha de préstamo: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_prestamo)}</Text></Text>
                <Text style={estilos.detalle}>Fecha de devolución: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_devolucion)}</Text></Text>
                {prestamo.fecha_devolucion_real ? (
                  <Text style={estilos.detalle}>Devolución real: <Text style={estilos.valorDetalle}>{formatearFecha(prestamo.fecha_devolucion_real)}</Text></Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      );
    }

    return (
      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion}>Mi información</Text>
        <View style={estilos.tarjetaPerfil}>
          {urlFotoPerfil ? (
            <Image source={{ uri: urlFotoPerfil }} style={estilos.fotoPerfil} />
          ) : (
            <View style={[estilos.fotoPerfil, estilos.fotoPerfilVacia]}>
              <Text style={estilos.textoSuave}>Sin fotografía</Text>
            </View>
          )}
          <Text style={estilos.datoPerfil}><Text style={estilos.etiquetaDato}>Nombre: </Text>{perfilUsuario?.nombre_completo ?? 'No disponible'}</Text>
          <Text style={estilos.datoPerfil}><Text style={estilos.etiquetaDato}>Carné: </Text>{perfilUsuario?.carne_universitario ?? 'No disponible'}</Text>
          <Text style={estilos.datoPerfil}><Text style={estilos.etiquetaDato}>Carrera: </Text>{perfilUsuario?.carrera ?? 'No disponible'}</Text>
          <Text style={estilos.datoPerfil}><Text style={estilos.etiquetaDato}>Correo: </Text>{perfilUsuario?.correo ?? 'No disponible'}</Text>
        </View>
      </View>
    );
  }, [cargando, seccionActiva, perfilUsuario, listaEquipos, listaPrestamos, urlFotoPerfil, idEquipoSolicitando]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <Text style={estilos.tituloEncabezado}>Panel del estudiante</Text>
        <TouchableOpacity onPress={cerrarSesion}>
          <Text style={estilos.cerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
      <View style={estilos.barraSecciones}>
        {([
          { clave: 'inicio', etiqueta: 'Inicio' },
          { clave: 'catalogo', etiqueta: 'Catálogo' },
          { clave: 'prestamos', etiqueta: 'Mis préstamos' },
          { clave: 'perfil', etiqueta: 'Perfil' },
        ] as { clave: SeccionEstudiante; etiqueta: string }[]).map((item) => (
          <TouchableOpacity
            key={item.clave}
            style={[estilos.botonSeccion, seccionActiva === item.clave && estilos.botonSeccionActiva]}
            onPress={() => establecerSeccionActiva(item.clave)}
          >
            <Text style={[estilos.textoSeccion, seccionActiva === item.clave && estilos.textoSeccionActiva]}>
              {item.etiqueta}
            </Text>
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
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: colores.grisClaro,
  },
  botonSeccionActiva: {
    backgroundColor: colores.celeste,
  },
  textoSeccion: {
    color: colores.azulOscuro,
    fontWeight: '600',
    fontSize: 12,
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
  seccion: {
    gap: 4,
  },
  tarjetaBienvenida: {
    backgroundColor: colores.azul,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  saludo: {
    color: colores.blanco,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  mensajeBienvenida: {
    color: colores.blanco,
    opacity: 0.95,
  },
  tarjetaOpcion: {
    backgroundColor: colores.blanco,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  tituloOpcion: {
    fontSize: 17,
    fontWeight: '700',
    color: colores.azulOscuro,
    marginBottom: 4,
  },
  descripcionOpcion: {
    color: colores.textoSuave,
    marginBottom: 10,
  },
  botonPequeno: {
    backgroundColor: colores.azul,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonPequenoSecundario: {
    backgroundColor: colores.celeste,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonPequenoAmarillo: {
    backgroundColor: colores.amarillo,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBoton: {
    color: colores.blanco,
    fontWeight: '600',
  },
  textoBotonOscuro: {
    color: colores.azulOscuro,
    fontWeight: '700',
  },
  tituloSeccion: {
    fontSize: 20,
    fontWeight: '700',
    color: colores.azulOscuro,
    marginBottom: 8,
  },
  textoVacio: {
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: 20,
  },
  botonAccion: {
    backgroundColor: colores.azul,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  etiquetaNoDisponible: {
    backgroundColor: '#FDECEA',
    padding: 10,
    borderRadius: 10,
  },
  textoNoDisponible: {
    color: colores.peligro,
    textAlign: 'center',
    fontWeight: '600',
  },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombreEquipo: {
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
  tarjetaPerfil: {
    backgroundColor: colores.blanco,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colores.borde,
  },
  fotoPerfil: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: colores.celeste,
  },
  fotoPerfilVacia: {
    backgroundColor: colores.grisClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datoPerfil: {
    width: '100%',
    color: colores.texto,
    marginTop: 8,
    fontSize: 15,
  },
  etiquetaDato: {
    fontWeight: '700',
    color: colores.azulOscuro,
  },
});
