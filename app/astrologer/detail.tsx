import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL as DEFAULT_BASE_URL } from '@/constants/Config';

const { width } = Dimensions.get('window');

type ChatMessage = {
  id: string;
  sender: 'user' | 'astrologer';
  type: 'text';
  content: string;
  time: string;
};

export default function AstrologerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
   const [profile, setProfile] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ rating: '4.9', reviews_count: 0 });

  const price = params.price ? parseFloat(params.price as string) : 10;
  const isOnline = params.online === 'true';

  // ── Chat Modal State ──
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMode, setChatMode] = useState<'text' | 'audio' | 'video'>('text');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [consultQuestion, setConsultQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      const savedUrl = await AsyncStorage.getItem('custom_server_url');
      let currentBaseUrl = DEFAULT_BASE_URL;
      if (savedUrl) {
        currentBaseUrl = savedUrl.endsWith('/api') ? savedUrl : `${savedUrl}/api`;
        setBaseUrl(currentBaseUrl);
      }
      const ud = await AsyncStorage.getItem('user_data');
      if (ud) setUser(JSON.parse(ud));
      
      // Fetch profile once URL is ready
      fetchProfile(currentBaseUrl);
    })();
  }, []);

  const fetchProfile = async (apiBase?: string) => {
    const targetUrl = apiBase || baseUrl;
    try {
        const res = await fetch(`${targetUrl}/astrologers/${params.id}`);
        const json = await res.json();
        if (json.success) {
            setProfile(json.data);
            setReviews(json.reviews || []);
            setStats(json.stats || { rating: '4.9', reviews_count: 0 });
        }
    } catch (e) {
        console.error('Fetch Profile Error:', e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
    if (baseUrl !== DEFAULT_BASE_URL) fetchProfile(); 
  }, [params.id]);

  const startConsultation = (mode: 'audio' | 'video' | 'chat') => {
    if (!isOnline) return Alert.alert('AstroMind', 'This astrologer is currently offline. Please try again later.');
    setChatMode(mode === 'chat' ? 'text' : mode);
    setMessages([
      { id: '1', sender: 'astrologer', type: 'text', content: `Vanakkam! I am ${params.name}. How can I guide you today? 🙏`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setIsUnlocked(false);
    setShowChatModal(true);
  };

  const handlePayAndConsult = async () => {
    if (!consultQuestion.trim()) return Alert.alert('Error', 'Please enter your question');
    setIsProcessing(true);
    try {
      if (!user) throw new Error('User not found');
      const amount = chatMode === 'video' ? 100 : (chatMode === 'audio' ? 50 : 10);
      const payRes = await fetch(`${baseUrl}/payment/dummy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, amount, type: 'debit' }) });
      const payJson = await payRes.json();
      if (!payJson.success) throw new Error(payJson.message || 'Payment failed');
  
      const sendRes = await fetch(`${baseUrl}/consultation/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, astrologer_id: parseInt(params.id as string), question: consultQuestion, amount, is_video_call: chatMode === 'video', is_audio_call: chatMode === 'audio' }) });
      const sendJson = await sendRes.json();
      if (sendJson.success) {
        setConsultationId(sendJson.consultation?.id);
        setIsUnlocked(true);
        setShowPayModal(false);
        setMessages(prev => [...prev, { id: 'q1', sender: 'user', type: 'text', content: consultQuestion, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setConsultQuestion('');
      } else throw new Error(sendJson.message || 'Failed');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setIsProcessing(false); }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = text.trim(); setText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', type: 'text', content: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    try {
      await fetch(`${baseUrl}/chat/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: user?.id, receiver_id: profile?.user_id || params.id, content: msg, type: 'text', consultation_id: consultationId || 1 }) });
    } catch (e) { console.error(e); }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (loading) {
    return (
        <CosmicBackground>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6c5ce7" />
            </View>
        </CosmicBackground>
    );
  }

  const displayBio = profile?.bio || `A highly experienced astrologer specializing in ${params.speciality}. Fluent in ${profile?.languages || params.language} and known for accurate, life-changing predictions.`;
  const displayExp = profile?.experience || params.experience;

  return (
    <>
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
              <View style={styles.statBox}><Text style={styles.statVal}>{displayExp} Yrs</Text><Text style={styles.statLabel}>Experience</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}><Text style={styles.statVal}>{stats.rating}⭐</Text><Text style={styles.statLabel}>Rating</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}><Text style={styles.statVal}>{stats.reviews_count || 0}</Text><Text style={styles.statLabel}>Reviews</Text></View>
            </View>
          </View>

          {/* ABOUT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{displayBio}</Text>
          </View>

          {/* EXPERTISE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas of Expertise</Text>
            <View style={styles.tagsRow}>
              {(profile?.specialization || params.speciality || 'Vedic Astrology').toString().split(',').map((t: string, i: number) => (
                <View key={i} style={styles.expertTag}>
                  <Text style={styles.expertTagText}>{t.trim()}</Text>
                </View>
              ))}
              <View style={styles.expertTag}><Text style={styles.expertTagText}>Birth Chart</Text></View>
              <View style={styles.expertTag}><Text style={styles.expertTagText}>Remedies</Text></View>
            </View>
          </View>

          {/* REVIEWS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {reviews.length > 0 ? reviews.map((r, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  {r.avatar && !r.avatar.includes('pravatar.cc') ? (
                    <Image source={{ uri: r.avatar }} style={styles.reviewAvatar} />
                  ) : (
                    <View style={[styles.reviewAvatar, { backgroundColor: '#131326', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="person-circle" size={36} color="#3b4a54" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUser}>{r.user}</Text>
                    <View style={styles.starsRow}>{[...Array(r.rating)].map((_, i) => <Ionicons key={i} name="star" size={12} color="#fdcb6e" />)}</View>
                  </View>
                  <Text style={styles.reviewDate}>{r.date}</Text>
                </View>
                <Text style={styles.reviewText}>{r.comment}</Text>
              </View>
            )) : (
              <View style={styles.emptyReviews}>
                <Ionicons name="chatbubbles-outline" size={32} color="#333" />
                <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to consult!</Text>
              </View>
            )}
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
      </View>
    </CosmicBackground>

    {/* ═══ FULL-SCREEN CHAT MODAL ═══ */}
    <Modal visible={showChatModal} animationType="slide" onRequestClose={() => setShowChatModal(false)}>
      <View style={{ flex: 1, backgroundColor: '#0b141a' }}>
        {/* Chat Header */}
        <View style={cs.header}>
          <TouchableOpacity onPress={() => setShowChatModal(false)} style={cs.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: params.avatar as string }} style={cs.avatar} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={cs.name} numberOfLines={1}>{params.name}</Text>
            <Text style={cs.status}>{isOnline ? 'online' : 'offline'}</Text>
          </View>
          <TouchableOpacity 
            style={cs.iconBtn} 
            onPress={() => isUnlocked ? router.push({ pathname: '/chat/live', params: { consultationId: String(consultationId), mode: 'video', name: params.name } }) : Alert.alert('AstroMind', 'Please start a paid session first.')}
          >
            <Ionicons name="videocam" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={cs.iconBtn}
            onPress={() => isUnlocked ? router.push({ pathname: '/chat/live', params: { consultationId: String(consultationId), mode: 'audio', name: params.name } }) : Alert.alert('AstroMind', 'Please start a paid session first.')}
          >
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={cs.securityBanner}>
            <Text style={cs.securityText}>🔒 Messages are end-to-end encrypted</Text>
          </View>
          {messages.map((msg) => (
            <View key={msg.id} style={[cs.msgRow, msg.sender === 'user' ? cs.msgRight : cs.msgLeft]}>
              <View style={[cs.bubble, msg.sender === 'user' ? cs.userBubble : cs.astroBubble]}>
                <Text style={cs.bubbleText}>{msg.content}</Text>
                <View style={cs.timeRow}>
                  <Text style={cs.timeText}>{msg.time}</Text>
                  {msg.sender === 'user' && <Ionicons name="checkmark-done" size={14} color="#53bdeb" style={{ marginLeft: 3 }} />}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input or Pay Gate */}
        {isUnlocked ? (
          <View style={cs.inputBar}>
            <View style={cs.inputWrap}>
              <TextInput style={cs.input} placeholder="Message" placeholderTextColor="#8696a0" value={text} onChangeText={setText} multiline />
            </View>
            <TouchableOpacity onPress={sendMessage} style={cs.sendBtn}>
              <Ionicons name={text.trim() ? 'send' : 'mic'} size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={cs.payGate}>
            <TouchableOpacity style={cs.payGateBtn} onPress={() => setShowPayModal(true)}>
              <Ionicons name="lock-closed" size={18} color="#ffd700" />
              <View style={{ marginLeft: 12 }}>
                <Text style={cs.payTitle}>Start Paid Consultation</Text>
                <Text style={cs.paySub}>₹{chatMode === 'video' ? 100 : (chatMode === 'audio' ? 50 : 10)} / Entry</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8696a0" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>

    {/* ═══ PAY MODAL ═══ */}
    <Modal visible={showPayModal} transparent animationType="slide">
      <View style={cs.overlay}>
        <View style={cs.payCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={cs.payCardTitle}>Consultation Details</Text>
            <TouchableOpacity onPress={() => setShowPayModal(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
          </View>
          <View style={cs.expertRow}>
            <Image source={{ uri: params.avatar as string }} style={cs.miniAvatar} />
            <View><Text style={cs.miniName}>{params.name}</Text><Text style={cs.miniSpec}>{params.speciality} • {chatMode.toUpperCase()}</Text></View>
          </View>
          <Text style={{ color: '#8696a0', fontSize: 13, marginBottom: 10 }}>What would you like to discuss?</Text>
          <TextInput style={cs.questionInput} placeholder="Type your question..." placeholderTextColor="#666" multiline value={consultQuestion} onChangeText={setConsultQuestion} />
          <View style={cs.costRow}><Text style={{ color: '#e9edef', fontSize: 15 }}>Entry Fee</Text><Text style={{ color: '#00a884', fontWeight: 'bold', fontSize: 22 }}>₹{chatMode === 'video' ? 100 : (chatMode === 'audio' ? 50 : 10)}</Text></View>
          <TouchableOpacity style={[cs.payBtn, isProcessing && { opacity: 0.7 }]} onPress={handlePayAndConsult} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <><Ionicons name="wallet-outline" size={20} color="#fff" /><Text style={cs.payBtnText}>Pay & Start Session</Text></>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

// ── Chat styles ──
const cs = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 55, paddingBottom: 10, backgroundColor: '#202c33', elevation: 4 },
  backBtn: { padding: 5 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#131326' },
  name: { color: '#e9edef', fontWeight: 'bold', fontSize: 16 },
  status: { color: '#00a884', fontSize: 12 },
  iconBtn: { padding: 10 },
  securityBanner: { backgroundColor: '#182229', padding: 10, borderRadius: 8, marginVertical: 10, alignSelf: 'center', width: '90%', borderWidth: 1, borderColor: '#222d34' },
  securityText: { color: '#ffd700', fontSize: 11, textAlign: 'center' },
  msgRow: { flexDirection: 'row', marginBottom: 4 },
  msgRight: { justifyContent: 'flex-end' },
  msgLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: width * 0.8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, elevation: 1 },
  userBubble: { backgroundColor: '#005c4b' },
  astroBubble: { backgroundColor: '#202c33' },
  bubbleText: { color: '#e9edef', fontSize: 15, lineHeight: 20 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  timeText: { color: '#8696a0', fontSize: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: '#0b141a', gap: 8 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#202c33', borderRadius: 25, paddingHorizontal: 15, minHeight: 48 },
  input: { flex: 1, color: '#e9edef', fontSize: 16, maxHeight: 120, paddingVertical: 8 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00a884', justifyContent: 'center', alignItems: 'center' },
  payGate: { backgroundColor: '#0b141a', padding: 12, borderTopWidth: 1, borderTopColor: '#222d34' },
  payGateBtn: { backgroundColor: '#202c33', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#3b4a54' },
  payTitle: { color: '#e9edef', fontWeight: 'bold', fontSize: 15 },
  paySub: { color: '#00a884', fontSize: 12, fontWeight: '600', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  payCard: { backgroundColor: '#202c33', borderRadius: 20, padding: 20, width: width * 0.95, maxHeight: '80%' },
  payCardTitle: { color: '#e9edef', fontSize: 18, fontWeight: 'bold' },
  expertRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 18 },
  miniAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#00a884' },
  miniName: { color: '#e9edef', fontSize: 16, fontWeight: 'bold' },
  miniSpec: { color: '#8696a0', fontSize: 12, marginTop: 2 },
  questionInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 18, color: '#e9edef', fontSize: 15, textAlignVertical: 'top', minHeight: 120, marginBottom: 20, borderWidth: 1, borderColor: '#3b4a54' },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, padding: 15, backgroundColor: 'rgba(0,168,132,0.1)', borderRadius: 15, alignItems: 'center' },
  payBtn: { backgroundColor: '#00a884', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, borderRadius: 22 },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});

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
  emptyReviews: { alignItems: 'center', paddingVertical: 30, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyReviewsText: { color: '#444', fontSize: 13, marginTop: 10, fontWeight: '500' },
});

