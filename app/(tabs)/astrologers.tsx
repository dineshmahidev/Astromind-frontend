import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BASE_URL = 'http://10.73.33.139:8000/api';

const FILTERS = ['All', 'Online', 'Vedic', 'Tarot', 'Nadi', 'Vastu'];

export default function AstrologersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [astrologers, setAstrologers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/astrologers`);
      const json = await response.json();
      if (json.success) setAstrologers(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = astrologers.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.specialization.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || (activeFilter === 'Online' && a.is_online) || a.specialization.toLowerCase().includes(activeFilter.toLowerCase());
    return matchSearch && matchFilter;
  });

  return (
    <CosmicBackground>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Our Astrologers</Text>
            <Text style={styles.subtitle}>{astrologers.filter(a => a.is_online).length} experts online now</Text>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.onlineText}>Live</Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialty..."
            placeholderTextColor="#555"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FILTERS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ASTROLOGER LIST */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchAstrologers}
          refreshing={loading}
          renderItem={({ item }) => {
            const astrologerParams = { 
              id: item.id, 
              name: item.name, 
              speciality: item.specialization, 
              experience: item.experience, 
              rating: item.rating, 
              price: item.price_per_minute, 
              language: item.languages, 
              avatar: item.profile_image || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', 
              online: item.is_online ? 'true' : 'false' 
            };

            return (
              <TouchableOpacity 
                style={styles.card} 
                onPress={() => router.push({ 
                  pathname: '/astrologer/detail', 
                  params: astrologerParams 
                })}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.avatarWrap}>
                    <Image 
                      source={{ uri: astrologerParams.avatar }} 
                      style={styles.avatar} 
                    />
                    {item.is_online && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{item.name}</Text>
                      {item.experience > 20 && (
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>Expert</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.spec}>{item.specialization}</Text>
                    <Text style={styles.exp}>{item.experience} yrs • {item.languages}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#fdcb6e" />
                      <Text style={styles.rating}>{item.rating}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.price}>₹{item.price_per_minute}/min</Text>
                  <View style={styles.consultBtn}>
                    <Text style={styles.consultText}>Consult</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 3 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,200,100,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00b894' },
  onlineText: { color: '#00b894', fontWeight: 'bold', fontSize: 13 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, paddingHorizontal: 15, height: 50, gap: 10, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterRow: { 
    marginBottom: 20, 
    maxHeight: 45, // Ensure fixed height for the filter row
    minHeight: 45 
  },
  filterBtn: { 
    paddingHorizontal: 16, 
    height: 38, // Fixed height for buttons
    justifyContent: 'center',
    borderRadius: 19, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    marginRight: 10, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.07)' 
  },
  filterBtnActive: { 
    backgroundColor: '#6c5ce7', 
    borderColor: '#a29bfe',
    shadowColor: '#6c5ce7',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
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
  reviews: { color: '#555', fontSize: 11 },
  cardRight: { alignItems: 'center', gap: 8 },
  price: { color: '#00cec9', fontWeight: 'bold', fontSize: 13 },
  consultBtn: { backgroundColor: '#6c5ce7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  consultText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
