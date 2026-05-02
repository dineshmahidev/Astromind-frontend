import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function AstrologerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'clients'

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) setUser(JSON.parse(userData));
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/auth/login');
  };

  if (!user) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <CosmicBackground>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Expert Console</Text>
            <Text style={styles.name}>{user.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#ff7675" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* DUTY TOGGLE CARD */}
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

        {/* CUSTOM TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('overview')} style={[styles.tab, activeTab === 'overview' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('clients')} style={[styles.tab, activeTab === 'clients' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === 'clients' && styles.activeTabText]}>My Clients</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {activeTab === 'overview' ? (
            <>
              {/* STATS GRID */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <View style={styles.statIconWrap}><Ionicons name="wallet-outline" size={22} color="#00cec9" /></View>
                  <Text style={styles.statVal}>₹4,250</Text>
                  <Text style={styles.statLabel}>Earnings</Text>
                </View>
                <View style={styles.statBox}>
                  <View style={styles.statIconWrap}><Ionicons name="people-outline" size={22} color="#6c5ce7" /></View>
                  <Text style={styles.statVal}>12</Text>
                  <Text style={styles.statLabel}>Total Clients</Text>
                </View>
              </View>

              {/* RECENT ACTIVITY */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  <TouchableOpacity onPress={() => setActiveTab('clients')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                </View>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={styles.consultCard}>
                    <View style={styles.clientInfo}>
                      <View style={[styles.avatarPlaceholder, { backgroundColor: item % 2 === 0 ? '#6c5ce7' : '#00cec9' }]}><Text style={styles.avatarText}>C</Text></View>
                      <View>
                        <Text style={styles.clientName}>Client #{1000 + item}</Text>
                        <Text style={styles.consultTime}>Today • 15 mins video call</Text>
                      </View>
                    </View>
                    <Text style={styles.consultFee}>+₹150</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            /* CLIENTS LIST VIEW */
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Consulting Clients</Text>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <TouchableOpacity key={item} style={styles.clientFullCard}>
                  <View style={styles.clientMain}>
                    <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>C</Text></View>
                    <View>
                      <Text style={styles.clientName}>Customer User {item}</Text>
                      <Text style={styles.clientSub}>Last consulted: 2 days ago</Text>
                    </View>
                  </View>
                  <View style={styles.clientStats}>
                    <Text style={styles.sessionCount}>3 Sessions</Text>
                    <Ionicons name="chevron-forward" size={16} color="#444" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* QUICK LINKS */}
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(tabs)/astrologers')}>
              <Ionicons name="eye-outline" size={20} color="#fff" />
              <Text style={styles.linkBtnText}>View My Public Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcome: { color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  name: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,118,117,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  logoutText: { color: '#ff7675', fontSize: 12, fontWeight: 'bold' },
  
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

  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 5, marginBottom: 25 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#6c5ce7' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 14 },
  activeTabText: { color: '#fff' },

  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#666', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  seeAll: { color: '#6c5ce7', fontSize: 13, fontWeight: 'bold' },

  consultCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#6c5ce7' },
  clientInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  clientName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  consultTime: { color: '#555', fontSize: 12, marginTop: 2 },
  consultFee: { color: '#00cec9', fontWeight: 'bold', fontSize: 16 },

  clientFullCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  clientMain: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  clientSub: { color: '#555', fontSize: 11, marginTop: 2 },
  clientStats: { alignItems: 'flex-end', gap: 4 },
  sessionCount: { color: '#6c5ce7', fontSize: 11, fontWeight: 'bold' },

  quickLinks: { marginTop: 10 },
  linkBtn: { backgroundColor: 'rgba(108,92,231,0.1)', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(108,92,231,0.2)' },
  linkBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
