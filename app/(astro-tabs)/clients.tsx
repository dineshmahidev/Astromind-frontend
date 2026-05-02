import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AstroClients() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'this_month', 'recent'

  const filters = [
    { id: 'all', label: 'All Clients' },
    { id: 'this_month', label: 'This Month' },
    { id: 'recent', label: 'Recent (WhatsApp style)' },
  ];

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Client Insights</Text>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="#6c5ce7" />
          </TouchableOpacity>
        </View>

        {/* FILTERS */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map(f => (
              <TouchableOpacity 
                key={f.id} 
                onPress={() => setActiveFilter(f.id)}
                style={[styles.filterChip, activeFilter === f.id && styles.activeChip]}
              >
                <Text style={[styles.chipText, activeFilter === f.id && styles.activeChipText]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <TouchableOpacity 
              key={item} 
              style={styles.clientCard}
              onPress={() => router.push({
                pathname: '/astrologer/chat',
                params: { clientId: item, clientName: `Premium User ${item}` }
              })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.clientMain}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: item % 2 === 0 ? '#6c5ce7' : '#00cec9' }]}>
                    <Text style={styles.avatarText}>U</Text>
                  </View>
                  <View>
                    <Text style={styles.clientName}>Premium User {item + 100}</Text>
                    <Text style={styles.clientSub}>Last: Today, 01:20 AM</Text>
                  </View>
                </View>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentText}>+₹{item * 50}</Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={styles.tag}>
                  <Ionicons name="time-outline" size={12} color="#888" />
                  <Text style={styles.tagText}>15 mins</Text>
                </View>
                <View style={styles.tag}>
                  <Ionicons name="star" size={12} color="#ffd700" />
                  <Text style={styles.tagText}>5.0</Text>
                </View>
                <Text style={styles.viewChat}>View Chart & Chat <Ionicons name="chevron-forward" size={12} /></Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* PAGINATION INFO */}
          <Text style={styles.paginationText}>Showing 5 of 128 clients</Text>
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  filterContainer: { marginBottom: 20 },
  filterScroll: { gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activeChip: { backgroundColor: '#6c5ce7', borderColor: '#6c5ce7' },
  chipText: { color: '#888', fontSize: 13, fontWeight: 'bold' },
  activeChipText: { color: '#fff' },

  clientCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  clientMain: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  clientName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  clientSub: { color: '#555', fontSize: 11, marginTop: 2 },
  
  paymentBadge: { backgroundColor: 'rgba(0,206,201,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  paymentText: { color: '#00cec9', fontWeight: 'bold', fontSize: 13 },
  
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  viewChat: { color: '#6c5ce7', fontSize: 12, fontWeight: 'bold', marginLeft: 'auto' },
  
  paginationText: { color: '#444', textAlign: 'center', fontSize: 12, marginTop: 10 }
});
