import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const REVIEWS = [
  { user: 'Priya S.', avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140052.png', comment: 'Amazing predictions! Very accurate and helpful.', rating: 5, date: '2 days ago' },
  { user: 'Ramesh K.', avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png', comment: 'Very knowledgeable astrologer. Highly recommend!', rating: 5, date: '1 week ago' },
  { user: 'Anitha M.', avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140061.png', comment: 'Helped me with my career decisions. Great insight.', rating: 4, date: '2 weeks ago' },
];

// Removed fixed-minute packages to ensure strict per-minute flow

export default function AstrologerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Price is now strictly enforced at ₹10/min as requested
  const price = 10;
  const isOnline = params.online === 'true';

  const startConsultation = (mode: 'audio' | 'video' | 'chat') => {
    if (!isOnline) return Alert.alert('AstroMind', 'This astrologer is currently offline. Please try again later.');
    
    router.push({ 
        pathname: mode === 'chat' ? '/chat/[id]' : '/chat/[id]', 
        params: { 
            id: params.id, 
            name: params.name, 
            mode: mode === 'chat' ? 'text' : mode, 
            price: price,
            avatar: params.avatar,
            online: params.online
        } 
    });
  };

  return (
    <CosmicBackground>
      <View style={{ flex: 1 }}>
        {/* BACK BUTTON */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          {/* PROFILE HERO */}
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: params.avatar as string }} style={styles.avatar} />
              {isOnline && <View style={styles.onlineDot} />}
            </View>
            <Text style={styles.name}>{params.name}</Text>
            <Text style={styles.spec}>{params.speciality}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}><Text style={styles.statVal}>{params.experience}</Text><Text style={styles.statLabel}>Experience</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}><Text style={styles.statVal}>{params.rating}⭐</Text><Text style={styles.statLabel}>Rating</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}><Text style={styles.statVal}>{params.reviews}</Text><Text style={styles.statLabel}>Reviews</Text></View>
            </View>
          </View>

          {/* ABOUT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>A highly experienced astrologer specializing in {params.speciality}. Fluent in {params.language} and known for accurate, life-changing predictions. Trusted by thousands across India.</Text>
          </View>

          {/* EXPERTISE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas of Expertise</Text>
            <View style={styles.tagsRow}>
              {[params.speciality, 'Birth Chart', 'Predictions', 'Remedies', 'Gemstones'].map((t, i) => (
                <View key={i} style={styles.expertTag}><Text style={styles.expertTagText}>{t as string}</Text></View>
              ))}
            </View>
          </View>

          {/* REVIEWS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {REVIEWS.map((r, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: r.avatar }} style={styles.reviewAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUser}>{r.user}</Text>
                    <View style={styles.starsRow}>{[...Array(r.rating)].map((_, i) => <Ionicons key={i} name="star" size={12} color="#fdcb6e" />)}</View>
                  </View>
                  <Text style={styles.reviewDate}>{r.date}</Text>
                </View>
                <Text style={styles.reviewText}>{r.comment}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* STICKY BOTTOM CTA */}
        <View style={styles.stickyBottom}>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceLabel}>Consultation</Text>
            <Text style={styles.priceValue}>₹{price} / min</Text>
          </View>
          
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={() => startConsultation('audio')}
            >
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={() => startConsultation('video')}
            >
              <Ionicons name="videocam" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.askBtn, !isOnline && styles.askBtnDisabled]}
              onPress={() => startConsultation('chat')}
            >
              <Ionicons name="chatbubble" size={18} color="#fff" />
              <Text style={styles.askBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pay Modal Removed - Everything is now per-minute in chat */}
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  backBtn: { position: 'absolute', top: 55, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' },
  hero: { alignItems: 'center', paddingTop: 100, paddingBottom: 30, paddingHorizontal: 20 },
  avatarWrap: { position: 'relative', marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#6c5ce7', backgroundColor: '#131326' },
  onlineDot: { position: 'absolute', bottom: 5, right: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: '#00b894', borderWidth: 3, borderColor: '#070714' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  spec: { color: '#6c5ce7', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 15, marginTop: 20, gap: 15 },
  statBox: { alignItems: 'center', flex: 1 },
  statVal: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  aboutText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  expertTag: { backgroundColor: 'rgba(108,92,231,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(108,92,231,0.3)' },
  expertTagText: { color: '#6c5ce7', fontSize: 12, fontWeight: '500' },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 15, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#131326' },
  reviewUser: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  starsRow: { flexDirection: 'row', marginTop: 2 },
  reviewDate: { color: '#555', fontSize: 11 },
  reviewText: { color: '#aaa', fontSize: 13, lineHeight: 20 },
  stickyBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0a0a1a', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', padding: 20, paddingBottom: 35, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { color: '#888', fontSize: 12 },
  priceValue: { color: '#00cec9', fontWeight: 'bold', fontSize: 18 },
  ctaRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  circleActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  askBtn: { backgroundColor: '#6c5ce7', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 18, shadowColor: '#6c5ce7', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  askBtnDisabled: { backgroundColor: '#333' },
  askBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0d0d1f', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 40, borderTopWidth: 1, borderColor: '#6c5ce7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, width: (width - 80) / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  typeBtnActive: { backgroundColor: 'rgba(108,92,231,0.2)', borderColor: '#6c5ce7' },
  typeLabel: { color: '#fff', fontWeight: '500', fontSize: 13 },
  typeMins: { color: '#888', fontSize: 11, marginTop: 3 },
  questionInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15, color: '#fff', fontSize: 14, textAlignVertical: 'top', minHeight: 100, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, padding: 12, backgroundColor: 'rgba(0,206,201,0.08)', borderRadius: 12 },
  costLabel: { color: '#aaa', fontSize: 14 },
  costValue: { color: '#00cec9', fontWeight: 'bold', fontSize: 18 },
  payBtn: { backgroundColor: '#6c5ce7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20, shadowColor: '#6c5ce7', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
