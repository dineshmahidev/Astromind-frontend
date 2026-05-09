import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight, SlideInLeft, FadeInDown, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '@/constants/Config';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ThinkingDots = () => {
  const dot1 = useAnimatedStyle(() => ({
    opacity: withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, true),
    transform: [{ scale: withRepeat(withSequence(withTiming(1.2, { duration: 400 }), withTiming(1, { duration: 400 })), -1, true) }]
  }));
  const dot2 = useAnimatedStyle(() => ({
    opacity: withDelay(200, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, true)),
    transform: [{ scale: withDelay(200, withRepeat(withSequence(withTiming(1.2, { duration: 400 }), withTiming(1, { duration: 400 })), -1, true)) }]
  }));
  const dot3 = useAnimatedStyle(() => ({
    opacity: withDelay(400, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, true)),
    transform: [{ scale: withDelay(400, withRepeat(withSequence(withTiming(1.2, { duration: 400 }), withTiming(1, { duration: 400 })), -1, true)) }]
  }));

  return (
    <View style={styles.thinkingContainer}>
      <Animated.View style={[styles.dot, dot1]} />
      <Animated.View style={[styles.dot, dot2]} />
      <Animated.View style={[styles.dot, dot3]} />
    </View>
  );
};

export default function AIScreen() {
  const router = useRouter();
  const { t, language: lang } = useLanguage();
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadUserContext();
    }, [])
  );

  useEffect(() => {
    if (userData && messages.length === 0) {
      setMessages([
        { id: '1', text: t.ai_welcome || "Hello! I'm your Astro AI. How can I help you today?", sender: 'bot', timestamp: new Date() }
      ]);
    }
  }, [userData, t]);

  const loadUserContext = async () => {
    const profile = await AsyncStorage.getItem('user_data');
    const astrology = await AsyncStorage.getItem('user_astrology');
    const birth = await AsyncStorage.getItem('birth_details');
    
    let combined = {};
    if (profile) combined = { ...combined, ...JSON.parse(profile) };
    if (astrology) combined = { ...combined, ...JSON.parse(astrology) };
    if (birth) combined = { ...combined, ...JSON.parse(birth) };
    
    setUserData(combined);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || msg;
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setMsg('');
    setLoading(true);
    
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          user_context: userData,
          lang
        }),
      });
      const json = await response.json();
      if (json.success) {
        const botMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            text: json.reply, 
            sender: 'bot', 
            timestamp: new Date() 
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Connection Error", "Astro AI is having trouble connecting to the stars.");
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050510' }}>
      <CosmicBackground>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <LinearGradient
                  colors={['#6c5ce7', '#a29bfe']}
                  style={styles.aiAvatar}
                >
                  <Ionicons name="sparkles" size={20} color="#fff" />
                </LinearGradient>
                <View>
                  <ThemedText style={styles.headerTitle}>Astro AI</ThemedText>
                  <View style={styles.statusRow}>
                    <View style={styles.onlineStatus} />
                    <ThemedText style={styles.headerStatus}>{loading ? "Thinking..." : "Online"}</ThemedText>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setMessages([])}>
                <Ionicons name="trash-outline" size={22} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Context Chips */}
            {userData && (
              <Animated.View entering={FadeInDown.delay(300)} style={styles.userBadge}>
                <View style={styles.badgeItem}>
                  <Ionicons name="moon" size={12} color="#f1c40f" />
                  <ThemedText style={styles.badgeText}>{userData.rasi || '?'}</ThemedText>
                </View>
                <View style={styles.badgeDivider} />
                <View style={styles.badgeItem}>
                  <Ionicons name="star" size={12} color="#00cec9" />
                  <ThemedText style={styles.badgeText}>{userData.nakshatra || '?'}</ThemedText>
                </View>
              </Animated.View>
            )}

            <ScrollView 
              ref={scrollRef}
              style={styles.chatScroll} 
              contentContainerStyle={styles.chatContent}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => (
                <Animated.View 
                  key={m.id} 
                  entering={m.sender === 'user' ? SlideInRight.springify() : SlideInLeft.springify()}
                  style={[
                    styles.messageWrapper,
                    m.sender === 'user' ? styles.userWrapper : styles.botWrapper
                  ]}
                >
                  {m.sender === 'user' ? (
                    <LinearGradient
                      colors={['#6c5ce7', '#4834d4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.messageBubble, styles.userBubble]}
                    >
                      <ThemedText style={styles.msgText}>{m.text}</ThemedText>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.messageBubble, styles.botBubble]}>
                      <ThemedText style={styles.msgText}>{m.text}</ThemedText>
                    </View>
                  )}
                </Animated.View>
              ))}
              
              {loading && (
                <Animated.View entering={FadeIn} style={styles.botWrapper}>
                  <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
                    <ThinkingDots />
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            <View style={styles.bottomArea}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.suggestions}
                contentContainerStyle={styles.suggestionsContent}
              >
                {[t.ai_suggestion_daily, t.ai_suggestion_business, t.ai_suggestion_nakshatra, t.ai_suggestion_color, t.ai_suggestion_remedy].filter(Boolean).map((s, idx) => (
                  <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => handleSend(s)}>
                    <ThemedText style={styles.suggestionText}>{s}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputArea}>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ask the universe..." 
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={msg}
                    onChangeText={setMsg}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[styles.sendButton, !msg.trim() && styles.disabledSend]} 
                    onPress={() => handleSend()}
                    disabled={!msg.trim() || loading}
                  >
                    <LinearGradient
                      colors={msg.trim() ? ['#6c5ce7', '#00cec9'] : ['#222', '#333']}
                      style={styles.sendIconGradient}
                    >
                      <Ionicons name="arrow-up" size={24} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </CosmicBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(5, 5, 16, 0.4)',
    justifyContent: 'space-between'
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#6c5ce7', shadowOpacity: 0.5, shadowRadius: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  onlineStatus: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00cec9' },
  headerStatus: { color: '#888', fontSize: 12, fontWeight: '500' },
  
  userBadge: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.04)', marginHorizontal: 20, marginVertical: 10, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', gap: 12 },
  badgeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  badgeDivider: { width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  
  chatScroll: { flex: 1 },
  chatContent: { padding: 20, paddingBottom: 40 },
  messageWrapper: { marginBottom: 20, width: '100%' },
  userWrapper: { alignItems: 'flex-end' },
  botWrapper: { alignItems: 'flex-start' },
  
  messageBubble: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 25, maxWidth: '85%' },
  userBubble: { borderBottomRightRadius: 5 },
  botBubble: { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  
  msgText: { color: '#fff', fontSize: 16, lineHeight: 24 },
  
  thinkingContainer: { flexDirection: 'row', gap: 4, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6c5ce7' },
  loadingBubble: { paddingVertical: 15, width: 70, alignItems: 'center' },
  
  bottomArea: { backgroundColor: 'rgba(5, 5, 16, 0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  suggestions: { height: 60 },
  suggestionsContent: { paddingHorizontal: 20, alignItems: 'center' },
  suggestionItem: { backgroundColor: 'rgba(108, 92, 231, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: 'rgba(108, 92, 231, 0.2)' },
  suggestionText: { color: '#a29bfe', fontSize: 12, fontWeight: '600' },
  
  inputArea: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 110 : 20, paddingTop: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 35, padding: 6, paddingLeft: 22, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  input: { flex: 1, color: '#fff', fontSize: 16, maxHeight: 120, paddingVertical: 10 },
  sendButton: { marginLeft: 10 },
  sendIconGradient: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  disabledSend: { opacity: 0.5 }
});
