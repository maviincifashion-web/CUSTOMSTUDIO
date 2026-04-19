import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { OutfitProvider } from '../src/context/OutfitContext';
import { FirebaseCatalogProvider } from '../src/context/FirebaseCatalogContext';
import { RemoteControlProvider } from '../src/context/RemoteControlContext';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Explicitly lock the screen to portrait
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <FirebaseCatalogProvider>
          <OutfitProvider>
            <RemoteControlProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="tv" options={{ headerShown: false }} />
                <Stack.Screen name="scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
              </Stack>
            </RemoteControlProvider>
          </OutfitProvider>
        </FirebaseCatalogProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
