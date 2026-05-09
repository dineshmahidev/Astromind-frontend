import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Text, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@/constants/Config';

export default function AddAstrologerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    specialization: '',
    experience: '',
    languages: '',
    bio: '',
    price_per_minute: '',
    profile_image: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' // Default avatar
  });

  const handleSave = async () => {
    if (!form.name || !form.specialization || !form.experience || !form.price_per_minute) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/astrologers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          experience: parseInt(form.experience),
          price_per_minute: parseFloat(form.price_per_minute)
        }),
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert('Success', 'Astrologer added successfully!');
        router.back();
      } else {
        Alert.alert('Error', json.message || 'Failed to add astrologer');
      }
    } catch (e) {
      Alert.alert('Error', 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CosmicBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Add Expert</ThemedText>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({...form, name: t})} placeholder="e.g. Pandit Sharma" placeholderTextColor="#666" />

          <Text style={styles.label}>Specialization *</Text>
          <TextInput style={styles.input} value={form.specialization} onChangeText={(t) => setForm({...form, specialization: t})} placeholder="e.g. Vedic Astrology, Numerology" placeholderTextColor="#666" />

          <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Experience (Years) *</Text>
              <TextInput style={styles.input} value={form.experience} onChangeText={(t) => setForm({...form, experience: t})} keyboardType="numeric" placeholder="e.g. 15" placeholderTextColor="#666" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Price / Min *</Text>
              <TextInput style={styles.input} value={form.price_per_minute} onChangeText={(t) => setForm({...form, price_per_minute: t})} keyboardType="numeric" placeholder="₹" placeholderTextColor="#666" />
            </View>
          </View>

          <Text style={styles.label}>Languages</Text>
          <TextInput style={styles.input} value={form.languages} onChangeText={(t) => setForm({...form, languages: t})} placeholder="e.g. Tamil, English, Hindi" placeholderTextColor="#666" />

          <Text style={styles.label}>Profile Bio</Text>
          <TextInput style={[styles.input, {height: 100}]} value={form.bio} onChangeText={(t) => setForm({...form, bio: t})} placeholder="Describe expertise..." placeholderTextColor="#666" multiline />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Expert Profile</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  label: { color: '#aaa', marginBottom: 8, fontSize: 12, marginTop: 15, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 15, color: '#fff', fontSize: 16 },
  row: { flexDirection: 'row', gap: 15 },
  saveBtn: { backgroundColor: '#6c5ce7', borderRadius: 15, padding: 18, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
