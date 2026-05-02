import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight, SlideInLeft, FadeInDown } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.73.33.139:8000/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

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
        { id: '1', text: t.ai_welcome, sender: 'bot', timestamp: new Date() }
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
        >
          <View style={styles.container}>
            {/* Premium Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerInfo}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={20} color="#6c5ce7" />
                  <View style={styles.onlineStatus} />
                </View>
                <View>
                  <ThemedText style={styles.headerTitle}>Astro AI</ThemedText>
                  <ThemedText style={styles.headerStatus}>{loading ? t.ai_consulting : t.ai_online}</ThemedText>
                </View>
              </View>
              <TouchableOpacity style={styles.headerAction}>
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* User Data Badge - Shows original results used for calculation */}
            {userData && (
              <Animated.View entering={FadeInDown.delay(300)} style={styles.userBadge}>
                <View style={styles.badgeItem}>
                  <Ionicons name="moon" size={14} color="#f1c40f" />
                  <ThemedText style={styles.badgeText}>{userData.rasi || '?'}</ThemedText>
                </View>
                <View style={styles.badgeDivider} />
                <View style={styles.badgeItem}>
                  <Ionicons name="star" size={14} color="#00cec9" />
                  <ThemedText style={styles.badgeText}>{userData.nakshatra || '?'}</ThemedText>
                </View>
                <View style={styles.badgeDivider} />
                <View style={styles.badgeItem}>
                  <Ionicons name="person" size={14} color="#6c5ce7" />
                  <ThemedText style={styles.badgeText}>{userData.name || 'User'}</ThemedText>
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
              {messages.map((m, i) => (
                <Animated.View 
                  key={m.id} 
                  entering={m.sender === 'user' ? FadeIn.delay(100) : FadeIn.delay(100)}
                  style={[
                    styles.messageWrapper,
                    m.sender === 'user' ? styles.userWrapper : styles.botWrapper
                  ]}
                >
                  <View style={[
                    styles.messageBubble,
                    m.sender === 'user' ? styles.userBubble : styles.botBubble
                  ]}>
                    <ThemedText style={styles.msgText}>{m.text}</ThemedText>
                    <ThemedText style={styles.msgTime}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </View>
                </Animated.View>
              ))}
              
              {loading && (
                <Animated.View entering={FadeIn} style={styles.botWrapper}>
                  <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
                    <ActivityIndicator color="#6c5ce7" size="small" />
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
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSend(t.ai_suggestion_daily)}>
                  <Ionicons name="sunny" size={14} color="#6c5ce7" />
                  <ThemedText style={styles.suggestionText}>{t.ai_suggestion_daily}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSend(t.ai_suggestion_business)}>
                  <Ionicons name="briefcase" size={14} color="#6c5ce7" />
                  <ThemedText style={styles.suggestionText}>{t.ai_suggestion_business}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSend(t.ai_suggestion_nakshatra)}>
                  <Ionicons name="star" size={14} color="#6c5ce7" />
                  <ThemedText style={styles.suggestionText}>{t.ai_suggestion_nakshatra}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSend(t.ai_suggestion_color)}>
                  <Ionicons name="color-palette" size={14} color="#6c5ce7" />
                  <ThemedText style={styles.suggestionText}>{t.ai_suggestion_color}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSend(t.ai_suggestion_remedy)}>
                  <Ionicons name="medical" size={14} color="#6c5ce7" />
                  <ThemedText style={styles.suggestionText}>{t.ai_suggestion_remedy}</ThemedText>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input} 
                    placeholder={t.ai_placeholder} 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={msg}
                    onChangeText={setMsg}
                    multiline
                  />
                  <TouchableOpacity 
                    style={[styles.sendButton, !msg.trim() && styles.disabledSend]} 
                    onPress={() => handleSend()}
                    disabled={!msg.trim() || loading}
                  >
                    <Ionicons name="arrow-up" size={24} color="#fff" />
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(5, 5, 16, 0.5)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00d1b2',
    borderWidth: 2,
    borderColor: '#050510',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerStatus: {
    color: '#6c5ce7',
    fontSize: 12,
    fontWeight: '500',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 30,
  },
  messageWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  botWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#6c5ce7',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingBubble: {
    width: 60,
    paddingVertical: 15,
    alignItems: 'center',
  },
  msgText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  msgTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bottomArea: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(5, 5, 16, 0.8)',
  },
  suggestions: {
  },
  suggestionsContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
  },
  suggestionText: {
    color: '#a29bfe',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 30,
    padding: 6,
    paddingLeft: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c5ce7',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledSend: {
    backgroundColor: 'rgba(108, 92, 231, 0.3)',
    opacity: 0.6,
  },
});
