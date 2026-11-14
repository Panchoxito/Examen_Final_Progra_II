import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colores } from '../estilos/colores';
import { supabase } from '../servicios/supabase';
import { obtenerPerfilUsuarioActual } from '../servicios/prestamos';

export default function PantallaInicioSesion() {
  const [correo, establecerCorreo] = useState<string>('');
  const [contrasena, establecerContrasena] = useState<string>('');
  const [cargando, establecerCargando] = useState<boolean>(false);
  const enrutador = useRouter();

  const iniciarSesion = async (): Promise<void> => {
    if (!correo.trim() || !contrasena) {
      Alert.alert('Campos incompletos', 'Debes ingresar tu correo y contraseña.');
      return;
    }
    establecerCargando(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo.trim().toLowerCase(),
        password: contrasena,
      });
      if (error) throw error;
      if (!data.session || !data.user) {
        Alert.alert('Inicio de sesión', 'No se pudo iniciar sesión. Si acabas de registrarte, verifica si debes confirmar tu correo electrónico.');
        return;
      }
      const perfil = await obtenerPerfilUsuarioActual();
      if (!perfil) {
        Alert.alert('Perfil no encontrado', 'No se encontró el perfil del usuario en la base de datos.');
        return;
      }
      if (perfil.rol === 'administrador') {
        enrutador.replace('/administrador');
      } else {
        enrutador.replace('/estudiante');
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      Alert.alert('Error al iniciar sesión', mensaje);
    } finally {
      establecerCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Bienvenido</Text>
      <Text style={estilos.subtitulo}>Ingresa con tu cuenta para continuar.</Text>

      <Text style={estilos.etiqueta}>Correo electrónico</Text>
      <TextInput
        style={estilos.campo}
        value={correo}
        onChangeText={establecerCorreo}
        placeholder="correo@ejemplo.com"
        placeholderTextColor={colores.textoSuave}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={estilos.etiqueta}>Contraseña</Text>
      <TextInput
        style={estilos.campo}
        value={contrasena}
        onChangeText={establecerContrasena}
        placeholder="Tu contraseña"
        placeholderTextColor={colores.textoSuave}
        secureTextEntry
      />

      <TouchableOpacity style={[estilos.boton, cargando && estilos.botonDeshabilitado]} onPress={iniciarSesion} disabled={cargando}>
        {cargando ? <ActivityIndicator color={colores.blanco} /> : <Text style={estilos.textoBoton}>Ingresar</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colores.grisClaro,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: colores.azulOscuro,
  },
  subtitulo: {
    color: colores.textoSuave,
    marginTop: 4,
    marginBottom: 16,
  },
  etiqueta: {
    color: colores.azulOscuro,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  campo: {
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colores.texto,
  },
  boton: {
    backgroundColor: colores.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: colores.blanco,
    fontWeight: '600',
    fontSize: 16,
  },
});
