import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const BASE_URL = 'http://10.73.33.139:8000/api';

export default function AstrologersScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [astrologers, setAstrologers] = useState<any[]>([]);

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/astrologers`);
      const json = await response.json();
      if (json.success) {
        setAstrologers(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderAstrologer = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)}
      style={styles.astroCard}
    >
      <View style={styles.cardContent}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.profile_image }} 
            style={styles.avatar} 
          />
          <View style={styles.onlineStatus} />
        </View>
        
        <View style={styles.info}>
          <ThemedText style={styles.name}>{item.name}</ThemedText>
          <ThemedText style={styles.specialty}>{item.specialization} • {item.city}</ThemedText>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={14} color="#f1c40f" />
              <ThemedText style={styles.statText}>{item.rating || '4.9'} (1k+)</ThemedText>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time" size={14} color="#00cec9" />
              <ThemedText style={styles.statText}>{item.experience} yrs</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.price}>₹{item.price_per_minute}/min</ThemedText>
        </View>

        <View style={styles.actionColumn}>
          <TouchableOpacity 
            style={styles.videoBtn}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name, mode: 'video' } })}
          >
            <Ionicons name="videocam" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.audioBtn}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name, mode: 'audio' } })}
          >
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name, mode: 'chat' } })}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <ThemedText style={styles.chatBtnText}>Chat</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{t.talk_astrologer}</ThemedText>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 100 }} />
        ) : (
          <FlatList
            data={astrologers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAstrologer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="rgba(255,255,255,0.1)" />
                <ThemedText style={styles.emptyText}>No astrologers online right now</ThemedText>
              </View>
            }
          />
        )}
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: '#fff',
  },
  listContent: {
    paddingBottom: 40,
  },
  astroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#131326',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00d1b2',
    borderWidth: 2,
    borderColor: '#050510',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00cec9',
  },
  actionColumn: {
    gap: 8,
    alignItems: 'center',
  },
  videoBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  audioBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatBtn: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#6c5ce7',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chatBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    gap: 20,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 16,
  },
});
