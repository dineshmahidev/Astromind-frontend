import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import { LanguageProvider } from '@/context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [segments]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      const inAuthGroup = segments[0] === 'auth';
      const isRoot = segments.length === 0 || (segments[0] === 'index');

      // Super Strict check: token must exist and not be a stringified 'null'
      const hasToken = token && token !== 'null' && token !== 'undefined' && token !== 'false' && userData;

      if (!hasToken) {
        if (!inAuthGroup) {
          router.replace('/auth/login');
        }
      } else if (hasToken && inAuthGroup) {
        const user = JSON.parse(userData);
        const userRole = String(user?.role || 'user').toLowerCase();
        if (userRole === 'astrologer') {
          router.replace('/(astro-tabs)');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (e) {
      console.error('Auth check error:', e);
      router.replace('/auth/login');
    } finally {
      setIsReady(true);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050510' }}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  return <>{children}</>;
}

import { useNotifications } from '@/hooks/useNotifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    if (expoPushToken) {
      AsyncStorage.setItem('expo_push_token', expoPushToken);
    }
  }, [expoPushToken]);

  return (
    <LanguageProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(astro-tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="birth-details" options={{ headerShown: false }} />
            <Stack.Screen name="horoscope" options={{ headerShown: false }} />
            <Stack.Screen name="matching" options={{ headerShown: false }} />
            <Stack.Screen name="kundli" options={{ headerShown: false }} />
            <Stack.Screen name="panchang" options={{ headerShown: false }} />
            <Stack.Screen name="chat/room1" options={{ headerShown: false }} />
            <Stack.Screen name="chat/live" options={{ headerShown: false }} />
            <Stack.Screen name="astrologer/detail" options={{ headerShown: false }} />
            <Stack.Screen name="chat/start" options={{ headerShown: false }} />
            <Stack.Screen name="chat/history/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthGuard>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LanguageProvider>
  );
}
