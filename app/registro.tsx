import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { colores } from '../estilos/colores';
import { supabase } from '../servicios/supabase';

export default function PantallaRegistro() {
  const [nombreCompleto, establecerNombreCompleto] = useState<string>('');
  const [carneUniversitario, establecerCarneUniversitario] = useState<string>('');
  const [carrera, establecerCarrera] = useState<string>('');
  const [correo, establecerCorreo] = useState<string>('');
  const [contrasena, establecerContrasena] = useState<string>('');
  const [confirmacionContrasena, establecerConfirmacionContrasena] = useState<string>('');
  const [uriFotografia, establecerUriFotografia] = useState<string | null>(null);
  const [tipoMimeFotografia, establecerTipoMimeFotografia] = useState<string>('image/jpeg');
  const [cargando, establecerCargando] = useState<boolean>(false);
  const enrutador = useRouter();

  const seleccionarFotografia = async (): Promise<void> => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar la fotografía.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!resultado.canceled && resultado.assets.length > 0) {
      const recurso = resultado.assets[0];
      establecerUriFotografia(recurso.uri);
      establecerTipoMimeFotografia(recurso.mimeType ?? 'image/jpeg');
    }
  };

  const validarFormulario = (): boolean => {
    if (!nombreCompleto.trim() || !carneUniversitario.trim() || !carrera.trim() || !correo.trim() || !contrasena || !confirmacionContrasena) {
      Alert.alert('Campos obligatorios', 'Debes completar todos los campos del formulario.');
      return false;
    }
    if (!uriFotografia) {
      Alert.alert('Fotografía requerida', 'Debes seleccionar una fotografía para registrarte.');
      return false;
    }
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formatoCorreo.test(correo.trim().toLowerCase())) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return false;
    }
    if (contrasena.length < 6) {
      Alert.alert('Contraseña', 'La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    if (contrasena !== confirmacionContrasena) {
      Alert.alert('Contraseña', 'La confirmación de contraseña no coincide.');
      return false;
    }
    return true;
  };

  const subirFotografia = async (idUsuario: string): Promise<string> => {
    if (!uriFotografia) {
      throw new Error('No se seleccionó ninguna fotografía.');
    }
    const respuesta = await fetch(uriFotografia);
    const arregloBytes = await respuesta.arrayBuffer();
    const partes = uriFotografia.split('.');
    const extension = partes.length > 1 ? partes[partes.length - 1].toLowerCase().split('?')[0] : 'jpg';
    const rutaArchivo = `${idUsuario}/perfil.${extension}`;
    const { error } = await supabase.storage
      .from('fotos_estudiantes')
      .upload(rutaArchivo, arregloBytes, { contentType: tipoMimeFotografia, upsert: true });
    if (error) throw error;
    return rutaArchivo;
  };

  const registrarEstudiante = async (): Promise<void> => {
    if (!validarFormulario()) return;
    establecerCargando(true);
    try {
      const correoNormalizado = correo.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: correoNormalizado,
        password: contrasena,
        options: {
          data: {
            nombre_completo: nombreCompleto.trim(),
            carne_universitario: carneUniversitario.trim(),
            carrera: carrera.trim(),
            foto: null,
          },
        },
      });
      if (error) throw error;

      const idUsuario = data.user?.id;
      if (!idUsuario) {
        throw new Error('No se pudo obtener el identificador del usuario registrado.');
      }

      if (data.session) {
        const rutaFoto = await subirFotografia(idUsuario);
        const { error: errorActualizacion } = await supabase
          .from('usuarios')
          .update({ foto: rutaFoto })
          .eq('id', idUsuario);
        if (errorActualizacion) {
          Alert.alert(
            'Registro creado',
            'Tu cuenta fue creada, pero no se pudo actualizar la ruta de la fotografía en tu perfil. Puedes intentar iniciar sesión y verificar tu información.'
          );
        } else {
          Alert.alert('Registro exitoso', 'Tu cuenta fue creada correctamente.');
        }
        enrutador.replace('/estudiante');
      } else {
        Alert.alert(
          'Confirma tu correo',
          'Tu cuenta fue creada. Debes confirmar tu correo electrónico antes de iniciar sesión y continuar con las operaciones que requieren autenticación. Después de confirmar, inicia sesión para usar la aplicación.'
        );
        enrutador.replace('/inicio-sesion');
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo completar el registro.';
      Alert.alert('Error en el registro', mensaje);
    } finally {
      establecerCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Crear cuenta de estudiante</Text>
      <Text style={estilos.subtitulo}>Completa tus datos para registrarte.</Text>

      <Text style={estilos.etiqueta}>Nombre completo</Text>
      <TextInput style={estilos.campo} value={nombreCompleto} onChangeText={establecerNombreCompleto} placeholder="Nombre y apellidos" placeholderTextColor={colores.textoSuave} />

      <Text style={estilos.etiqueta}>Carné universitario</Text>
      <TextInput style={estilos.campo} value={carneUniversitario} onChangeText={establecerCarneUniversitario} placeholder="Número de carné" placeholderTextColor={colores.textoSuave} />

      <Text style={estilos.etiqueta}>Carrera</Text>
      <TextInput style={estilos.campo} value={carrera} onChangeText={establecerCarrera} placeholder="Carrera que estudias" placeholderTextColor={colores.textoSuave} />

      <Text style={estilos.etiqueta}>Fotografía</Text>
      {uriFotografia ? <Image source={{ uri: uriFotografia }} style={estilos.fotografia} /> : null}
      <TouchableOpacity style={estilos.botonSecundario} onPress={seleccionarFotografia}>
        <Text style={estilos.textoBotonSecundario}>{uriFotografia ? 'Cambiar fotografía' : 'Seleccionar fotografía'}</Text>
      </TouchableOpacity>

      <Text style={estilos.etiqueta}>Correo electrónico</Text>
      <TextInput style={estilos.campo} value={correo} onChangeText={establecerCorreo} placeholder="correo@ejemplo.com" placeholderTextColor={colores.textoSuave} autoCapitalize="none" keyboardType="email-address" />

      <Text style={estilos.etiqueta}>Contraseña</Text>
      <TextInput style={estilos.campo} value={contrasena} onChangeText={establecerContrasena} placeholder="Mínimo 6 caracteres" placeholderTextColor={colores.textoSuave} secureTextEntry />

      <Text style={estilos.etiqueta}>Confirmar contraseña</Text>
      <TextInput style={estilos.campo} value={confirmacionContrasena} onChangeText={establecerConfirmacionContrasena} placeholder="Repite la contraseña" placeholderTextColor={colores.textoSuave} secureTextEntry />

      <TouchableOpacity style={[estilos.boton, cargando && estilos.botonDeshabilitado]} onPress={registrarEstudiante} disabled={cargando}>
        {cargando ? <ActivityIndicator color={colores.blanco} /> : <Text style={estilos.textoBoton}>Registrarme</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colores.grisClaro,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: colores.azulOscuro,
  },
  subtitulo: {
    color: colores.textoSuave,
    marginTop: 4,
    marginBottom: 12,
  },
  etiqueta: {
    color: colores.azulOscuro,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
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
  fotografia: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: colores.celeste,
  },
  boton: {
    backgroundColor: colores.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  botonSecundario: {
    backgroundColor: colores.celeste,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: colores.blanco,
    fontWeight: '600',
    fontSize: 16,
  },
  textoBotonSecundario: {
    color: colores.blanco,
    fontWeight: '600',
  },
});
