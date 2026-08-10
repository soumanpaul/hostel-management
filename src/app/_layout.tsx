import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AppLoading } from '@/components/app-loading';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAppStore } from '@/store/app-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializeApp = useAppStore((state) => state.initializeApp);
  const initError = useAppStore((state) => state.error);

  useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {initError ? (
        <AppLoading message={initError} />
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </ThemeProvider>
  );
}
