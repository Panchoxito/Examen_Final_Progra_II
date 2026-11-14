import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const urlSupabase = process.env.EXPO_PUBLIC_SUPABASE_URL;
const clavePublicableSupabase = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!urlSupabase || !clavePublicableSupabase) {
  throw new Error('Faltan las variables de entorno de Supabase. Verifica el archivo .env.');
}

export const supabase = createClient(urlSupabase, clavePublicableSupabase, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const obtenerUrlPublicaImagenEquipo = (rutaImagen: string | null): string | null => {
  if (!rutaImagen) return null;
  if (rutaImagen.startsWith('http://') || rutaImagen.startsWith('https://')) {
    return rutaImagen;
  }
  const { data } = supabase.storage.from('imagenes_equipos').getPublicUrl(rutaImagen);
  return data.publicUrl;
};

export const obtenerUrlFirmadaFotoEstudiante = async (rutaFoto: string | null): Promise<string | null> => {
  if (!rutaFoto) return null;
  if (rutaFoto.startsWith('http://') || rutaFoto.startsWith('https://')) {
    return rutaFoto;
  }
  const { data, error } = await supabase.storage
    .from('fotos_estudiantes')
    .createSignedUrl(rutaFoto, 60 * 60);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
};
