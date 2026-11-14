import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colores } from '../estilos/colores';
import type { Equipo } from '../tipos/equipo';

interface PropiedadesTarjetaEquipo {
  equipo: Equipo;
  urlImagen: string | null;
  accion?: React.ReactNode;
}

export default function TarjetaEquipo({ equipo, urlImagen, accion }: PropiedadesTarjetaEquipo) {
  return (
    <View style={estilos.tarjeta}>
      {urlImagen ? (
        <Image source={{ uri: urlImagen }} style={estilos.imagen} resizeMode="cover" />
      ) : (
        <View style={[estilos.imagen, estilos.imagenVacia]}>
          <Text style={estilos.textoImagenVacia}>Sin imagen</Text>
        </View>
      )}
      <View style={estilos.contenido}>
        <Text style={estilos.nombre}>{equipo.nombre}</Text>
        <Text style={estilos.descripcion}>{equipo.descripcion}</Text>
        <View style={estilos.filaEstado}>
          <Text style={[estilos.estado, { color: equipo.disponible ? colores.exito : colores.peligro }]}>
            {equipo.disponible ? 'Disponible' : 'No disponible'}
          </Text>
        </View>
        {accion ? <View style={estilos.accion}>{accion}</View> : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colores.borde,
  },
  imagen: {
    width: '100%',
    height: 160,
    backgroundColor: colores.grisClaro,
  },
  imagenVacia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoImagenVacia: {
    color: colores.textoSuave,
  },
  contenido: {
    padding: 14,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '700',
    color: colores.azulOscuro,
    marginBottom: 4,
  },
  descripcion: {
    color: colores.textoSuave,
    marginBottom: 8,
  },
  filaEstado: {
    marginBottom: 8,
  },
  estado: {
    fontWeight: '600',
  },
  accion: {
    marginTop: 4,
  },
});
