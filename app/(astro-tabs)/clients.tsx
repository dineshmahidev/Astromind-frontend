import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl, FlatList } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '@/constants/translations';

export default function AstroClients() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth() + 1);
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentLang, setCurrentLang] = useState('en');
  const [baseUrl, setBaseUrl] = useState('https://astro.90skalyanam.com/api');

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    setPage(1);
    setConsultations([]);
    fetchClients(1, true);
    loadLang();
  }, [activeFilter, activeMonth, activeYear]);

  const loadLang = async () => {
    const lang = await AsyncStorage.getItem('app_lang');
    if (lang) setCurrentLang(lang);
  };

  const t = translations[currentLang] || translations.en;

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

  const fetchClients = async (pageNum = 1, isInitial = false) => {
    try {
        if (isInitial) setLoading(true);
        const userData = await AsyncStorage.getItem('user_data');
        if (!userData) return;
        const user = JSON.parse(userData);
        
        const customUrl = await AsyncStorage.getItem('custom_server_url');
        const currentBaseUrl = customUrl ? (customUrl.endsWith('/api') ? customUrl : `${customUrl}/api`) : 'https://astro.90skalyanam.com/api';
        setBaseUrl(currentBaseUrl);

        const res = await fetch(`${currentBaseUrl}/astrologer/consultations?user_id=${user.id}&filter=${activeFilter}&month=${activeMonth}&year=${activeYear}&page=${pageNum}`);
        const json = await res.json();
        if (json.success) {
            const newData = json.data.data;
            if (isInitial) {
                setConsultations(newData);
            } else {
                setConsultations([...consultations, ...newData] as any);
            }
            setHasMore(json.data.next_page_url !== null);
            setPage(pageNum);
        }
    } catch (e) {
        console.error('Clients Fetch Error:', e);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
        fetchClients(page + 1);
    }
  };

  const renderClientItem = ({ item }: { item: any }) => {
    const userAvatar = item.user?.avatar;
    const currentServer = baseUrl.replace('/api', '');
    const avatarUrl = userAvatar ? (userAvatar.startsWith('http') ? userAvatar : `${currentServer}/storage/${userAvatar}`) : null;
    const statusColor = item.status === 'open' ? '#00b894' : '#636e72';
    const statusLabel = item.status === 'open' ? t.active : t.closed;

    return (
        <TouchableOpacity 
            style={styles.clientCard}
            onPress={() => router.push({
                pathname: '/chat/room1',
                params: { 
                    id: item.astrologer_id,
                    clientId: item.user_id,
                    name: item.user?.name || 'Client',
                    avatar: avatarUrl,
                    consultationId: item.id
                }
            })}
        >
        <View style={styles.cardHeader}>
            <View style={styles.clientMain}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                ) : (
                    <View style={[styles.avatarImg, { backgroundColor: item.id % 2 === 0 ? '#6c5ce7' : '#00cec9', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.user?.name?.charAt(0)}</Text>
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{item.user?.name}</Text>
                    <Text style={styles.clientSub}>
                        {item.astro_data?.rasi || 'Unknown'} • {item.astro_data?.nakshatra || 'Unknown'}
                    </Text>
                </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                {item.is_new ? (
                    <>
                        <View style={[styles.statusDot, { backgroundColor: '#00ff88' }]} />
                        <Text style={[styles.statusText, { color: '#00ff88' }]}>{t.new}</Text>
                    </>
                ) : (
                    <>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </>
                )}
            </View>
        </View>

        {item.question && (
            <View style={styles.questionPreview}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6c5ce7" />
                <Text style={styles.questionText} numberOfLines={2}>{item.question}</Text>
            </View>
        )}
        
        <View style={styles.cardFooter}>
            <View style={styles.tag}>
                <Ionicons name="time-outline" size={12} color="#888" />
                <Text style={styles.tagText}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.tag}>
                <Ionicons name={item.call_type === 'video' ? 'videocam' : (item.call_type === 'audio' ? 'call' : 'chatbubble')} size={12} color="#888" />
                <Text style={styles.tagText}>{item.call_type || 'chat'}</Text>
            </View>
            <View style={styles.paymentBadge}>
                <Text style={styles.paymentText}>₹{item.amount_paid}</Text>
            </View>
            {item.message_count > 0 && (
                <View style={styles.msgCountBadge}>
                    <Text style={styles.msgCountText}>{item.message_count} {t.msgs}</Text>
                </View>
            )}
            <Text style={styles.viewChat}>{t.reply} <Ionicons name="chevron-forward" size={12} /></Text>
        </View>
        </TouchableOpacity>
    );
  };

  const tabs = [
    { id: 'all', label: t.all, icon: 'list' },
    { id: 'pending', label: t.pending, icon: 'time' },
    { id: 'completed', label: t.completed, icon: 'checkmark-done' },
  ];

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t.clients}</Text>
          </View>
          <View style={styles.monthNavigator}>
            <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.monthDisplay}>
                <Text style={styles.monthLabel}>{monthNames[activeMonth - 1]}</Text>
                <Text style={styles.yearLabel}>{activeYear}</Text>
            </View>
            <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {tabs.map(t_item => (
            <TouchableOpacity 
              key={t_item.id} 
              onPress={() => setActiveFilter(t_item.id)}
              style={[styles.tab, activeFilter === t_item.id && styles.activeTab]}
            >
              <Ionicons name={t_item.icon as any} size={16} color={activeFilter === t_item.id ? '#fff' : '#888'} />
              <Text style={[styles.tabText, activeFilter === t_item.id && styles.activeTabText]}>{t_item.label}</Text>
              {activeFilter === t_item.id && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
        {loading && page === 1 ? (
            <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 100 }} />
        ) : (
            <FlatList
                data={consultations}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderClientItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchClients(1, true)} tintColor="#6c5ce7" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Ionicons name="people-outline" size={40} color="rgba(255,255,255,0.05)" />
                        <Text style={styles.emptyText}>{t.no_sessions}</Text>
                    </View>
                }
                ListFooterComponent={
                    hasMore ? <ActivityIndicator color="#6c5ce7" style={{ marginVertical: 20 }} /> : null
                }
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />
        )}
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', letterSpacing: 0.5 },
  monthNavigator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 8, gap: 10 },
  monthDisplay: { alignItems: 'center', minWidth: 90 },
  monthLabel: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  yearLabel: { color: '#6c5ce7', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(108,92,231,0.2)', justifyContent: 'center', alignItems: 'center' },

  tabContainer: { flexDirection: 'row', gap: 10, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 16, position: 'relative' },
  activeTab: { backgroundColor: 'rgba(108,92,231,0.1)' },
  tabText: { color: '#888', fontSize: 13, fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  tabIndicator: { position: 'absolute', bottom: 6, width: 20, height: 3, borderRadius: 2, backgroundColor: '#6c5ce7' },

  clientCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  clientMain: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatarImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)' },
  clientName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  clientSub: { color: '#555', fontSize: 11, marginTop: 2 },
  
  paymentBadge: { backgroundColor: 'rgba(0,206,201,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  paymentText: { color: '#00cec9', fontWeight: 'bold', fontSize: 13 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontWeight: 'bold', fontSize: 11 },

  questionPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10, paddingHorizontal: 5, marginBottom: 5, backgroundColor: 'rgba(108,92,231,0.05)', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#6c5ce7' },
  questionText: { color: '#bbb', fontSize: 13, lineHeight: 18, flex: 1 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  viewChat: { color: '#6c5ce7', fontSize: 12, fontWeight: 'bold', marginLeft: 'auto' },

  msgCountBadge: { backgroundColor: 'rgba(108,92,231,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  msgCountText: { color: '#6c5ce7', fontSize: 10, fontWeight: 'bold' },
  
  emptyBox: { height: 200, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
  emptyText: { color: '#888', fontSize: 14, marginTop: 10 },
  paginationText: { color: '#444', textAlign: 'center', fontSize: 12, marginTop: 10 }
});
