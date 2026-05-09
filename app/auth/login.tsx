import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_URL } from '@/constants/Config';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [serverUrl, setServerUrl] = useState(SERVER_URL);
  const [showConfig, setShowConfig] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    // Check for custom override, but default to our new SERVER_URL
    AsyncStorage.getItem('custom_server_url').then(val => {
      if (val) setServerUrl(val);
    });
  }, []);

  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 3) {
      setShowConfig(true);
      setTapCount(0);
    }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) return setErrorMsg('Please fill all fields');
    
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (json.success) {
        setSuccessMsg('Login successful! Connecting...');
        await AsyncStorage.setItem('user_token', 'true');
        await AsyncStorage.setItem('user_data', JSON.stringify(json.user));
        
        if (json.user.role === 'user' && json.user.dob) {
            await AsyncStorage.setItem('birth_details', JSON.stringify({
                name: json.user.name,
                day: json.user.dob.split('-')[2],
                month: json.user.dob.split('-')[1],
                year: json.user.dob.split('-')[0],
                hour: json.user.tob ? json.user.tob.split(':')[0] : '12',
                minute: json.user.tob ? json.user.tob.split(':')[1] : '00'
            }));
        }

        setTimeout(() => {
            const userRole = String(json.user.role).toLowerCase();
            if (userRole === 'astrologer') {
                router.replace('/(astro-tabs)');
            } else {
                router.replace('/(tabs)');
            }
        }, 1000);
      } else {
        setErrorMsg(json.message || 'Invalid credentials');
      }
    } catch (e) {
      setErrorMsg('Could not connect to server. Check your URL/Wi-Fi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <TouchableOpacity style={styles.logoContainer} activeOpacity={0.8} onPress={handleLogoTap}>
            <Ionicons name="moon" size={80} color="#ffffff" />
            <ThemedText type="title" style={styles.appName}>AstroMind</ThemedText>
            <Text style={styles.tagline}>Unlock Your Cosmic Potential</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          {showConfig && (
            <View style={[styles.inputBox, { borderColor: '#00cec9', borderStyle: 'dashed' }]}>
              <Ionicons name="server-outline" size={20} color="#00cec9" />
              <TextInput 
                style={styles.input} 
                placeholder="Server URL (e.g. http://ip:8000)" 
                placeholderTextColor="#666" 
                value={serverUrl}
                onChangeText={(val) => {
                  setServerUrl(val);
                  AsyncStorage.setItem('custom_server_url', val);
                }}
              />
              <TouchableOpacity style={{ marginRight: 10 }} onPress={() => {
                setServerUrl(SERVER_URL);
                AsyncStorage.removeItem('custom_server_url');
              }}>
                <Ionicons name="refresh-circle" size={24} color="#e84393" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowConfig(false)}>
                <Ionicons name="checkmark-circle" size={24} color="#00cec9" />
              </TouchableOpacity>
            </View>
          )}

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
              secureTextEntry={secureText}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

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
  linkText: { color: '#6c5ce7', fontWeight: 'bold' },
  errorText: { color: '#ff7675', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  successText: { color: '#00cec9', fontSize: 14, textAlign: 'center', fontWeight: '500' }
});
