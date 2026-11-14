import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colores } from '../estilos/colores';
import { supabase } from '../servicios/supabase';
import { obtenerPerfilUsuarioActual } from '../servicios/prestamos';

export default function PantallaBienvenida() {
  const enrutador = useRouter();
  const [cargando, establecerCargando] = useState<boolean>(true);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const perfil = await obtenerPerfilUsuarioActual();
          if (perfil?.rol === 'administrador') {
            enrutador.replace('/administrador');
            return;
          }
          if (perfil?.rol === 'estudiante') {
            enrutador.replace('/estudiante');
            return;
          }
        }
      } finally {
        establecerCargando(false);
      }
    };
    verificarSesion();
  }, [enrutador]);

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color={colores.azul} />
        <Text style={estilos.textoCarga}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.decoracionArriba} />
      <View style={estilos.decoracionAbajo} />
      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>Sistema de Gestión de Equipos de Laboratorio</Text>
        <Text style={estilos.subtitulo}>
          Consulta el catálogo, solicita equipos y da seguimiento a tus préstamos.
        </Text>
        <View style={estilos.botones}>
          <Text style={estilos.botonPrimario} onPress={() => enrutador.push('/inicio-sesion')}>
            Iniciar sesión
          </Text>
          <Text style={estilos.botonSecundario} onPress={() => enrutador.push('/registro')}>
            Registrarse
          </Text>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.blanco,
    justifyContent: 'center',
    padding: 24,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.grisClaro,
  },
  textoCarga: {
    marginTop: 12,
    color: colores.textoSuave,
  },
  decoracionArriba: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colores.celeste,
    opacity: 0.25,
  },
  decoracionAbajo: {
    position: 'absolute',
    bottom: -90,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colores.azul,
    opacity: 0.15,
  },
  contenido: {
    zIndex: 1,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    color: colores.azulOscuro,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitulo: {
    fontSize: 16,
    color: colores.textoSuave,
    textAlign: 'center',
    marginBottom: 28,
  },
  botones: {
    gap: 12,
  },
  botonPrimario: {
    backgroundColor: colores.azul,
    color: colores.blanco,
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '600',
    overflow: 'hidden',
  },
  botonSecundario: {
    borderWidth: 2,
    borderColor: colores.azul,
    color: colores.azul,
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '600',
    overflow: 'hidden',
  },
});
