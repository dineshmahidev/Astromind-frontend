import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';

export default function AstroHome() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth() + 1);
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ earnings_today: 0, total_consults: 0, completed_count: 0, wallet_balance: 0 });
  const [debugData, setDebugData] = useState<any>(null);
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://astro.90skalyanam.com/api');

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    loadProfile();
  }, [activeMonth, activeYear]);

  const changeMonth = (dir: 'prev' | 'next') => {
    if (dir === 'prev') {
        if (activeMonth === 1) {
            setActiveMonth(12);
            setActiveYear(activeYear - 1);
        } else {
            setActiveMonth(activeMonth - 1);
        }
    } else {
        if (activeMonth === 12) {
            setActiveMonth(1);
            setActiveYear(activeYear + 1);
        } else {
            setActiveMonth(activeMonth + 1);
        }
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) {
      await fetchDashboard(JSON.parse(userData).id);
    }
    setRefreshing(false);
  }, [activeMonth, activeYear]);

  const handleLogout = async () => {
    Alert.alert(t.logout, t.logout_confirm, [
      { text: t.cancel, style: 'cancel' },
      { 
        text: t.logout, 
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
        fetchDashboard(parsed.id);
    }
  };

  const fetchDashboard = async (id: any) => {
    try {
        const customUrl = await AsyncStorage.getItem('custom_server_url');
        const currentBaseUrl = customUrl ? (customUrl.endsWith('/api') ? customUrl : `${customUrl}/api`) : 'https://astro.90skalyanam.com/api';
        setBaseUrl(currentBaseUrl);
        
        const res = await fetch(`${currentBaseUrl}/astrologer/dashboard?user_id=${id}&month=${activeMonth}&year=${activeYear}`);
        const json = await res.json();
        if (json.success) {
            setStats(json.stats);
            setConsultations(json.consultations);
            setDebugData({ expert_id: json.expert_id, input_user_id: json.input_user_id });
            if (json.expert) setUser({ ...user, ...json.expert });
        }
    } catch (e) {
        console.error('Dashboard Error:', e);
    } finally {
        setLoading(false);
    }
  };

  if (!user || loading) return <ActivityIndicator style={{ flex: 1, marginTop: 100 }} />;

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="power" size={24} color="#ff7675" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.welcome}>{t.welcome_expert}</Text>
            <Text style={styles.name}>{user.name}</Text>
          </View>
          <Image 
            source={{ uri: user.profile_image || 'https://i.pravatar.cc/100?u='+user.id }} 
            style={styles.headerAvatar} 
          />
        </View>

        {/* Month Navigator */}
        <View style={styles.homeMonthNav}>
            <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={16} color="#fff" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.monthLabel}>{monthNames[activeMonth - 1]}</Text>
                <Text style={styles.yearLabel}>{activeYear}</Text>
            </View>
            <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />
          }
        >
          <View style={[styles.statusCard, isOnDuty ? styles.statusCardOn : styles.statusCardOff]}>
            <View>
              <Text style={styles.statusTitle}>{isOnDuty ? t.on_duty : t.off_duty}</Text>
              <Text style={styles.statusSub}>{isOnDuty ? t.available_instant : t.currently_hidden}</Text>
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
              <View style={styles.statIconWrap}><Ionicons name="wallet" size={22} color="#00cec9" /></View>
              <Text style={styles.statVal}>₹{stats.wallet_balance?.toLocaleString() || '0'}</Text>
              <Text style={styles.statLabel}>{t.balance}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconWrap}><Ionicons name="people-outline" size={22} color="#6c5ce7" /></View>
              <Text style={styles.statVal}>{stats.total_consults || '0'}</Text>
              <Text style={styles.statLabel}>{t.total}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconWrap}><Ionicons name="checkmark-done-circle-outline" size={22} color="#00b894" /></View>
              <Text style={styles.statVal}>{stats.completed_count || '0'}</Text>
              <Text style={styles.statLabel}>{t.completed}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={styles.sectionTitle}>{t.recent_sessions}</Text>
                <TouchableOpacity onPress={() => router.push('/(astro-tabs)/clients')}>
                    <Text style={{ color: '#6c5ce7', fontSize: 12, fontWeight: 'bold' }}>{t.view_all}</Text>
                </TouchableOpacity>
            </View>
            {consultations.length > 0 ? (
                consultations.slice(0, 3).map((item: any) => {
                    const userAvatar = item.user?.avatar;
                    const currentServer = baseUrl.replace('/api', '');
                    const avatarUrl = userAvatar ? (userAvatar.startsWith('http') ? userAvatar : `${currentServer}/storage/${userAvatar}`) : null;

                    return (
                        <TouchableOpacity 
                            key={item.id} 
                            style={[styles.consultCard, item.is_new && styles.consultCardNew]}
                            onPress={() => router.push({
                                pathname: '/chat/room1',
                                params: {
                                    id: user.id,
                                    clientId: item.user_id,
                                    name: item.user?.name || 'Client',
                                    mode: item.call_type || 'chat',
                                    consultationId: item.id
                                }
                            })}
                        >
                            <View style={styles.clientInfo}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.listAvatar} />
                                ) : (
                                    <View style={[styles.listAvatar, { backgroundColor: item.id % 2 === 0 ? '#6c5ce7' : '#00cec9', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.user?.name?.charAt(0)}</Text>
                                    </View>
                                )}
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={styles.clientName}>{item.user?.name}</Text>
                                        {item.is_new && (
                                            <View style={styles.newBadge}>
                                                <View style={styles.dot} />
                                                <Text style={styles.newText}>{t.new}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.latestMsg} numberOfLines={1}>
                                        {item.latest_message || 'No message yet'}
                                    </Text>
                                    <Text style={styles.clientAstro}>
                                        {item.astro_data?.rasi || 'Details'} • {item.astro_data?.nakshatra || 'Pending'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <View style={styles.emptyBox}>
                    <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.05)" />
                    <Text style={styles.emptyText}>{t.no_sessions}</Text>
                </View>
            )}
          </View>

          {/* DEBUG INFO */}
          <View style={{ padding: 20, opacity: 0.3 }}>
            <Text style={{ color: '#fff', fontSize: 10 }}>Debug: UserID {user.id} | ExpertID {debugData?.expert_id || 'N/A'} | InputID {debugData?.input_user_id || 'N/A'}</Text>
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
  homeMonthNav: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 12, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  monthLabel: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  yearLabel: { color: '#6c5ce7', fontSize: 10, fontWeight: 'bold' },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(108,92,231,0.2)', justifyContent: 'center', alignItems: 'center' },
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
  emptyText: { color: '#444', fontSize: 14, marginTop: 10 },
  consultCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  consultCardNew: { backgroundColor: 'rgba(108,92,231,0.08)', borderColor: 'rgba(108,92,231,0.3)', borderLeftWidth: 4, borderLeftColor: '#6c5ce7' },
  clientInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)' },
  clientName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  latestMsg: { color: '#888', fontSize: 12, marginTop: 2, marginBottom: 4 },
  clientAstro: { color: '#6c5ce7', fontSize: 11, fontWeight: 'bold' },
  newBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6c5ce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ff88', marginRight: 4 },
  newText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  consultAction: { alignItems: 'flex-end', marginLeft: 10 },
  consultTime: { color: '#555', fontSize: 10, marginBottom: 4 }
});
