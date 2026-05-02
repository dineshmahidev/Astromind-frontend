import React from 'react';
import { Tabs } from 'expo-router';
import { AstroCustomTabBar } from '@/components/AstroCustomTabBar';

export default function AstroLayout() {
  return (
    <Tabs
      tabBar={(props) => <AstroCustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
