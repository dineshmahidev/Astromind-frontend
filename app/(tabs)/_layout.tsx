import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    const data = await AsyncStorage.getItem('user_data');
    if (data) {
      const user = JSON.parse(data);
      if (user.role === 'astrologer') {
        router.replace('/(astro-tabs)');
      }
    }
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="astrologers" options={{ title: 'Experts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
