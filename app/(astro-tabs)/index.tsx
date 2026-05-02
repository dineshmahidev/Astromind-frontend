import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function AstroHome() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ earnings_today: 0, total_consults: 0 });
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to exit your expert console?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          await AsyncStorage.multiRemove(['user_token', 'user_data']);
          router.replace('/auth/login');
        } 
      }
    ]);
  };

  const loadProfile = async () => {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        fetchStats(parsed.id);
    }
  };

  const fetchStats = async (id: any) => {
    try {
        const res = await fetch(`http://10.73.33.139:8000/api/astrologer/stats?id=${id}`);
        const json = await res.json();
        if (json.success) setStats(json);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (!user || loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="power" size={24} color="#ff7675" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.welcome}>Welcome Expert,</Text>
            <Text style={styles.name}>{user.name}</Text>
          </View>
          <Image 
            source={{ uri: user.profile_image || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} 
            style={styles.headerAvatar} 
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.statusCard, isOnDuty ? styles.statusCardOn : styles.statusCardOff]}>
            <View>
              <Text style={styles.statusTitle}>{isOnDuty ? 'You are ON DUTY' : 'You are OFF DUTY'}</Text>
              <Text style={styles.statusSub}>{isOnDuty ? 'Available for instant consultations' : 'Currently hidden from customers'}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsOnDuty(!isOnDuty)} 
              style={[styles.toggleBtn, isOnDuty ? styles.toggleOn : styles.toggleOff]}
            >
              <View style={[styles.toggleDot, isOnDuty ? styles.dotOn : styles.dotOff]} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={styles.statIconWrap}><Ionicons name="wallet-outline" size={22} color="#00cec9" /></View>
              <Text style={styles.statVal}>₹{stats.earnings_today.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconWrap}><Ionicons name="people-outline" size={22} color="#6c5ce7" /></View>
              <Text style={styles.statVal}>{stats.total_consults}</Text>
              <Text style={styles.statLabel}>Total Consults</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.05)" />
              <Text style={styles.emptyText}>No scheduled sessions yet</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,118,117,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(108,92,231,0.3)' },
  welcome: { color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  name: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  badge: { backgroundColor: 'rgba(108,92,231,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
  badgeText: { color: '#6c5ce7', fontSize: 10, fontWeight: 'bold' },
  statusCard: { borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderWidth: 1 },
  statusCardOn: { backgroundColor: 'rgba(0,184,148,0.1)', borderColor: 'rgba(0,184,148,0.3)' },
  statusCardOff: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' },
  statusTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  statusSub: { color: '#aaa', fontSize: 12, marginTop: 4 },
  toggleBtn: { width: 54, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: '#00b894' },
  toggleOff: { backgroundColor: '#444' },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  dotOn: { alignSelf: 'flex-end' },
  dotOff: { alignSelf: 'flex-start' },
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emptyBox: { backgroundColor: 'rgba(255,255,255,0.02)', height: 150, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { color: '#444', fontSize: 14, marginTop: 10 }
});
