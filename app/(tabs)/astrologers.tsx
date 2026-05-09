import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
let BASE_URL = 'http://10.22.133.139:8000/api';

const FILTERS = ['All', 'Online', 'Vedic', 'Tarot', 'Nadi', 'Vastu'];

import { useFocusEffect } from 'expo-router';

export default function AstrologersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('Astrologer');
  const [activeFilter, setActiveFilter] = useState('All');
  const [astrologers, setAstrologers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState('0');
  const [userData, setUserData] = useState<any>(null);
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);
  const [historyConsultations, setHistoryConsultations] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
        fetchAstrologers();
        loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
        const savedUrl = await AsyncStorage.getItem('custom_server_url');
        if (savedUrl) BASE_URL = savedUrl;

        const savedUser = await AsyncStorage.getItem('user_data');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            setUserData(user);
            setWalletBalance(user.wallet_balance || '0');
            fetchHistory(user.id);
        }
    } catch (e) {
        console.error('Load User Data Error:', e);
    }
  };

  const fetchHistory = async (userId: any) => {
    try {
        const response = await fetch(`${BASE_URL}/user/history?user_id=${userId}`);
        const json = await response.json();
        if (json.success) {
            setHistoryTransactions(json.transactions);
            setHistoryConsultations(json.consultations);
        }
    } catch (e) {
        console.error('Fetch History Error:', e);
    }
  };

  const fetchAstrologers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/astrologers`);
      const json = await response.json();
      if (json && json.success) {
        setAstrologers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = astrologers.filter(a => {
    const isPalmReader = String(a.category || '').toLowerCase().includes('palm');
    const isAstrologer = String(a.category || '').toLowerCase() === 'astrologer';
    
    if (selectedTab === 'Astrologer' && !isAstrologer) return false;
    if (selectedTab === 'Palm Reader' && !isPalmReader) return false;

    const matchSearch = String(a.name || '').toLowerCase().includes(search.toLowerCase()) || 
                      String(a.specialization || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || 
                      (activeFilter === 'Online' && a.is_online) || 
                      String(a.specialization || '').toLowerCase().includes(activeFilter.toLowerCase());
    return matchSearch && matchFilter;
  });

  const HistoryView = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>💳 Transaction History</Text>
        {historyTransactions.length > 0 ? historyTransactions.map((item, i) => (
          <View key={item.id} style={styles.historyCard}>
            <View>
              <Text style={styles.histName}>{item.type === 'credit' ? 'Wallet Recharge' : 'Consultation Fee'}</Text>
              <Text style={styles.histDate}>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <Text style={[styles.histAmt, { color: item.type === 'credit' ? '#00cec9' : '#ff7675' }]}>
                {item.type === 'credit' ? '+' : '-'} ₹{item.amount}
            </Text>
          </View>
        )) : (
            <Text style={{ color: '#666', textAlign: 'center', marginTop: 10 }}>No transactions yet</Text>
        )}
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>💬 Chat History</Text>
        {historyConsultations.length > 0 ? historyConsultations.map((item, i) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.historyCard}
            onPress={() => router.push({
                pathname: '/chat/history/[id]',
                params: { 
                    id: item.id, 
                    name: item.expert?.name || 'Expert',
                    avatar: item.expert?.profile_image || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'
                }
            })}
          >
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Image 
                source={{ uri: item.expert?.profile_image || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} 
                style={{ width: 40, height: 40, borderRadius: 20 }} 
              />
              <View>
                <Text style={styles.histName}>{item.expert?.name || 'Expert'}</Text>
                <Text style={styles.histDate}>{item.call_type === 'chat' ? 'Chat Session' : 'Call Session'}</Text>
              </View>
            </View>
            <Text style={styles.histAmt}>₹{item.amount_paid}</Text>
          </TouchableOpacity>
        )) : (
            <Text style={{ color: '#666', textAlign: 'center', marginTop: 10 }}>No chat history yet</Text>
        )}
      </View>
    </ScrollView>
  );

  const renderItem = ({ item }: { item: any }) => {
    const name = String(item.name || '');
    const spec = String(item.specialization || '');
    const exp = String(item.experience || '0');
    const lang = String(item.languages || '');
    const rating = String(item.rating || '0.0');
    const price = String(item.price_per_minute || '10');
    const avatar = String(item.profile_image || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png');

    // Check if there is an active (open) consultation for this expert
    const activeConsult = historyConsultations.find(c => c.astrologer_id === item.id && c.status === 'open');

    const handlePress = () => {
      if (activeConsult) {
        router.push({
          pathname: '/chat/room1',
          params: {
            id: String(item.id),
            expertUserId: String(item.user_id),
            clientId: String(userData?.id || ''),
            name: name,
            mode: activeConsult.call_type || 'chat',
            consultationId: String(activeConsult.id)
          }
        });
      } else {
        router.push({ 
          pathname: '/astrologer/detail', 
          params: { 
            id: item.id, 
            name: name, 
            speciality: spec, 
            experience: exp, 
            rating: rating, 
            price: price, 
            language: lang, 
            avatar: avatar, 
            online: item.is_online ? 'true' : 'false' 
          } 
        });
      }
    };

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={handlePress}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            {item.is_online ? <View style={styles.onlineDot} /> : null}
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {Number(exp) > 20 ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{`Expert`}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.spec}>{spec}</Text>
            <Text style={styles.exp}>{`${exp} yrs • ${lang}`}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#fdcb6e" />
              <Text style={styles.rating}>{rating}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.price}>{activeConsult ? 'Ongoing' : `₹${price}/min`}</Text>
          <View style={[styles.consultBtn, activeConsult && { backgroundColor: '#00b894' }]}>
            <Text style={styles.consultText}>{activeConsult ? 'Resume' : 'Consult'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{`Expert Advice`}</Text>
            <Text style={styles.subtitle}>{`${astrologers.filter(a => a.is_online).length} online now`}</Text>
          </View>
          <TouchableOpacity style={styles.walletBadge} onPress={() => router.push('/profile')}>
            <Ionicons name="wallet" size={18} color="#fdcb6e" />
            <Text style={styles.walletAmt}>₹{parseFloat(walletBalance).toFixed(0)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {['Astrologer', 'Palm Reader', 'History'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, selectedTab === tab && styles.activeTab]} 
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTab !== 'History' && (
          <>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${selectedTab}...`}
                placeholderTextColor="#555"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View style={styles.filterRowContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {FILTERS.map(f => (
                  <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}>
                    <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <FlatList
              data={filtered}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              onRefresh={fetchAstrologers}
              refreshing={loading}
              renderItem={renderItem}
            />
          </>
        )}

        {selectedTab === 'History' && <HistoryView />}
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 3 },
  walletBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(253, 203, 110, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, gap: 6, borderWidth: 1, borderColor: 'rgba(253, 203, 110, 0.2)' },
  walletAmt: { color: '#fdcb6e', fontWeight: 'bold', fontSize: 14 },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 5, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 15 },
  activeTab: { backgroundColor: 'rgba(108, 92, 231, 0.3)' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 13 },
  activeTabText: { color: '#fff' },
  historySection: { marginBottom: 25 },
  historyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  historyCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  histName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  histDate: { color: '#666', fontSize: 12, marginTop: 2 },
  histAmt: { color: '#ff7675', fontWeight: 'bold', fontSize: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, paddingHorizontal: 15, height: 50, gap: 10, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterRowContainer: { marginBottom: 20, height: 45 },
  filterRow: { flex: 1 },
  filterBtn: { paddingHorizontal: 16, height: 38, justifyContent: 'center', borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  filterBtnActive: { backgroundColor: '#6c5ce7', borderColor: '#a29bfe' },
  filterText: { color: '#888', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 16, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 65, height: 65, borderRadius: 32, backgroundColor: '#131326', borderWidth: 2, borderColor: 'rgba(108,92,231,0.3)' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#00b894', borderWidth: 2, borderColor: '#070714' },
  info: { flex: 1, justifyContent: 'center', gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  tag: { backgroundColor: 'rgba(108,92,231,0.2)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagText: { color: '#6c5ce7', fontSize: 10, fontWeight: 'bold' },
  spec: { color: '#aaa', fontSize: 12 },
  exp: { color: '#666', fontSize: 11 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { color: '#fdcb6e', fontSize: 12, fontWeight: 'bold' },
  cardRight: { alignItems: 'center', gap: 8 },
  price: { color: '#00cec9', fontWeight: 'bold', fontSize: 13 },
  consultBtn: { backgroundColor: '#6c5ce7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  consultText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
