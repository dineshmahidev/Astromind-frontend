import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ChatHistoryDetail() {
  const router = useRouter();
  const { id, name, avatar } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
        const savedUser = await AsyncStorage.getItem('user_data');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            fetchMessages(parsedUser.id);
        }
    } catch (e) {
        console.error('Load Data Error:', e);
    }
  };

  const fetchMessages = async (userId: any) => {
    try {
        const savedUrl = await AsyncStorage.getItem('custom_server_url');
        const BASE_URL = savedUrl || 'http://10.22.133.139:8000/api';
        
        const response = await fetch(`${BASE_URL}/consultation/messages?consultation_id=${id}`);
        const json = await response.json();
        
        if (json.success) {
            setMessages(json.messages);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    } catch (e) {
        console.error('Fetch Messages Error:', e);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return (
    <CosmicBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6c5ce7" />
        </View>
    </CosmicBackground>
  );

  return (
    <CosmicBackground>
      <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: (avatar as string) || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{name || 'Expert'}</Text>
            <Text style={styles.headerSub}>Past Consultation</Text>
          </View>
        </View>

        <ScrollView 
            ref={scrollRef}
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => {
            const isUser = msg.sender_id === user?.id;
            return (
              <View key={msg.id} style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.astroBubble]}>
                  {msg.type === 'image' ? (
                    <Image source={{ uri: msg.content }} style={styles.msgImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.msgText}>{msg.content}</Text>
                  )}
                  <Text style={styles.msgTime}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })}
          
          {messages.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="chatbubbles-outline" size={48} color="#333" />
                <Text style={{ color: '#666', marginTop: 10 }}>No messages found for this session.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: 'rgba(5, 5, 16, 0.8)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#6c5ce7' },
  headerName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  headerSub: { color: '#00cec9', fontSize: 11, fontWeight: 'bold' },

  msgRow: { flexDirection: 'row', marginBottom: 15, width: '100%' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  
  bubble: { maxWidth: width * 0.75, padding: 12, borderRadius: 20 },
  userBubble: { backgroundColor: '#6c5ce7', borderBottomRightRadius: 4 },
  astroBubble: { backgroundColor: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  msgText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  msgImage: { width: width * 0.6, height: width * 0.4, borderRadius: 12, marginBottom: 5 },
  msgTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
});
