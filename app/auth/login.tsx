import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      const response = await fetch('http://10.73.33.139:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (json.success) {
        await AsyncStorage.setItem('user_token', 'true');
        await AsyncStorage.setItem('user_data', JSON.stringify(json.user));
        await AsyncStorage.setItem('birth_details', JSON.stringify({
            name: json.user.name,
            day: json.user.dob.split('-')[2],
            month: json.user.dob.split('-')[1],
            year: json.user.dob.split('-')[0],
            hour: json.user.tob.split(':')[0],
            minute: json.user.tob.split(':')[1]
        }));
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', json.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
            <Ionicons name="moon" size={80} color="#ffffff" />
            <ThemedText type="title" style={styles.appName}>AstroMind</ThemedText>
            <Text style={styles.tagline}>Unlock Your Cosmic Potential</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor="#ffffff" 
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" />
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor="#ffffff" 
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.switchText}>Don't have an account? <Text style={styles.linkText}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  appName: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 15 },
  tagline: { color: '#888', fontSize: 14, marginTop: 5 },
  form: { gap: 20 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, paddingHorizontal: 15, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
  loginBtn: { backgroundColor: '#6c5ce7', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#6c5ce7', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  loginText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchText: { color: '#888', textAlign: 'center', marginTop: 10 },
  linkText: { color: '#6c5ce7', fontWeight: 'bold' }
});
