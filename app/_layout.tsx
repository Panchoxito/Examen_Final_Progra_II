import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colores } from '../estilos/colores';

export default function DisenoRaiz() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.azul },
          headerTintColor: colores.blanco,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colores.grisClaro },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="inicio-sesion" options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="registro" options={{ title: 'Registro de estudiante' }} />
        <Stack.Screen name="estudiante" options={{ title: 'Panel del estudiante', headerShown: false }} />
        <Stack.Screen name="administrador" options={{ title: 'Panel del administrador', headerShown: false }} />
      </Stack>
    </>
  );
}
