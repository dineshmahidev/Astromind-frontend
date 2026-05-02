import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function AstroProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) setUser(JSON.parse(userData));
  };

  const pickImage = async () => {
    try {
        if (!ImagePicker.launchImageLibraryAsync) {
            Alert.alert('Module Error', 'Image picker is not available in this environment. Please restart your Expo app.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });

        if (!result.canceled) {
          updateProfileImage(result.assets[0].uri);
        }
    } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const updateProfileImage = async (uri: string) => {
    setUploading(true);
    try {
        // In a real app, you'd upload to S3/Cloudinary then save URL to Laravel
        // For now, we update local state and sync with AsyncStorage
        const updatedUser = { ...user, profile_image: uri };
        setUser(updatedUser);
        await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        // Push to backend
        await fetch('http://10.73.33.139:8000/api/astrologer/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id, profile_image: uri })
        });

        Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to sync with server, but updated locally.');
    } finally {
        setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to exit your expert console?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/auth/login');
      }}
    ]);
  };

  if (!user) return null;

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Expert Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.avatar} />
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="card-outline" size={20} color="#888" />
                <Text style={styles.menuText}>Earnings & Payments</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="settings-outline" size={20} color="#888" />
                <Text style={styles.menuText}>Consultation Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="help-circle-outline" size={20} color="#888" />
                <Text style={styles.menuText}>Expert Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#6c5ce7" />
            <Text style={styles.infoText}>Your profile is visible to customers when you are "On Duty". You can update your bio and specialization from the web portal.</Text>
          </View>
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  logoutText: { color: '#ff7675', fontWeight: 'bold' },
  profileCard: { alignItems: 'center', marginBottom: 40 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#6c5ce7' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#6c5ce7', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0d0d1f' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  email: { color: '#888', fontSize: 14, marginTop: 5 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 18, marginBottom: 10 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { color: '#fff', fontSize: 15 },
  infoBox: { backgroundColor: 'rgba(108,92,231,0.05)', padding: 20, borderRadius: 20, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: 'rgba(108,92,231,0.1)' },
  infoText: { color: '#888', fontSize: 12, flex: 1, lineHeight: 18 }
});
