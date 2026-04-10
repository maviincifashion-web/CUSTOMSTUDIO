import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Hamari Home Screen */}
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      {/* Outfit Selection Screen */}
      <Stack.Screen name="outfit" options={{ title: 'Select Outfit' }} />
      {/* Nayi Kurta Screen (jo hum abhi banayenge) */}
      <Stack.Screen name="kurta" options={{ title: 'Kurta Customizer' }} />
    </Stack>
  );
}