import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('user_token');
    if (token) {
      const userData = await AsyncStorage.getItem('user_data');
      const user = userData ? JSON.parse(userData) : null;
      const userRole = user?.role ? String(user.role).toLowerCase() : 'user';
      
      if (userRole === 'astrologer') {
          router.replace('/(astro-tabs)');
      } else {
          router.replace('/(tabs)');
      }
    } else {
      router.replace('/auth/login');
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a1a' }}>
      <ActivityIndicator size="large" color="#6c5ce7" />
    </View>
  );
}
