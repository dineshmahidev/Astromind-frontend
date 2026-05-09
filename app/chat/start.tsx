import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, SlideInBottom } from 'react-native-reanimated';

let BASE_URL = 'http://10.22.133.139:8000/api';

export default function ChatScreen() {
  const { expertId, name, mode, initialMessage, charge, expertUserId } = useLocalSearchParams();
  const id = expertId; // Map expertId to local id variable for consistency with existing logic
  const router = useRouter();
  const { t } = useLanguage();
  const [question, setQuestion] = useState(
    initialMessage ? String(initialMessage) :
    mode === 'video' ? 'I want to have a video consultation for detailed chart analysis.' : 
    mode === 'audio' ? 'I want to have an audio consultation.' : ''
  );
  const [loading, setLoading] = useState(false);

  const isFollowUp = charge === '10';
  const amount = isFollowUp ? 10 : (mode === 'video' ? 100 : (mode === 'audio' ? 50 : 10));

  const handlePayAndSend = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter your question first');
      return;
    }

    setLoading(true);
    try {
      const savedUrl = await AsyncStorage.getItem('custom_server_url');
      if (savedUrl) BASE_URL = savedUrl;

      const savedUser = await AsyncStorage.getItem('user_data');
      if (!savedUser) throw new Error('User not found');
      const user = JSON.parse(savedUser);
      const userId = user.id;

      // Add artificial delay so indication is visible
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 1. Simulate Dummy Payment
      const payResponse = await fetch(`${BASE_URL}/payment/dummy`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({
          user_id: userId, 
          amount: amount,
          type: 'debit'
        })
      });
// ... 
      const payText = await payResponse.text();
      let payJson;
      try {
        payJson = JSON.parse(payText);
      } catch (e) {
        console.error('Failed to parse payment response:', payText);
        throw new Error('Invalid server response during payment');
      }

      if (payJson.success) {
        // 2. Submit Question
        const sendResponse = await fetch(`${BASE_URL}/consultation/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            astrologer_id: parseInt(String(id)),
            question: question,
            amount: amount,
            is_video_call: mode === 'video',
            is_audio_call: mode === 'audio'
          })
        });

        const sendText = await sendResponse.text();
        let sendJson;
        try {
          sendJson = JSON.parse(sendText);
        } catch (e) {
          Alert.alert('Server Error', 'Failed to submit consultation. Server returned invalid response.');
          return;
        }

        if (sendJson.success) {
          Alert.alert(
            mode === 'video' ? 'Video Call' : (mode === 'audio' ? 'Audio Call' : 'Success'), 
            mode === 'video' || mode === 'audio'
              ? `Payment successful! Connecting you to the astrologer...` 
              : 'Payment successful and question sent! The astrologer will respond soon.',
            [{ 
              text: 'OK', 
              onPress: () => {
                router.replace({
                    pathname: '/chat/room1' as any,
                    params: {
                        id: String(id),
                        expertUserId: String(expertUserId || ''),
                        clientId: String(user.id),
                        name: String(name),
                        mode: String(mode),
                        startCall: (mode === 'video' || mode === 'audio') ? 'true' : 'false',
                        consultationId: String(sendJson.consultation?.id || '')
                    }
                });
              } 
            }]
          );
        } else {
          console.log('Consultation Error Response:', sendJson);
          Alert.alert('Consultation Error', sendJson.message || 'Failed to start consultation. Please try again.');
        }
      } else {
        console.log('Payment Error Response:', payJson);
        Alert.alert('Payment Failed', payJson.message || 'Unable to process payment. Please check your wallet balance.');
      }
    } catch (error: any) {
      console.error('System/SQL Error Details:', error);
      Alert.alert('System Error', error.message || 'Something went wrong. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CosmicBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <ThemedText style={styles.headerTitle}>
              {mode === 'video' ? 'Video Call' : (mode === 'audio' ? 'Audio Call' : 'Chat')} with {name}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {mode === 'video' ? 'Live Video Consultation' : (mode === 'audio' ? 'Live Audio Consultation' : 'Paid Chat Consultation')}
            </ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.delay(200)} style={styles.infoCard}>
            <Ionicons name={mode === 'video' ? 'videocam' : (mode === 'audio' ? 'call' : 'information-circle')} size={24} color="#6c5ce7" />
            <ThemedText style={styles.infoText}>
              {isFollowUp
                ? 'A follow-up fee of ₹10 will be deducted from your wallet for this expert analysis.'
                : mode === 'video' 
                ? 'A fee of ₹100 will be deducted from your wallet for this live video session.'
                : mode === 'audio'
                ? 'A fee of ₹50 will be deducted from your wallet for this live audio session.'
                : 'Type your question below. A fee of ₹25 will be deducted from your wallet for this consultation.'}
            </ThemedText>
          </Animated.View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>{mode === 'video' || mode === 'audio' ? 'Topics to Discuss' : 'Your Question'}</ThemedText>
            <TextInput
              style={styles.input}
              placeholder={mode === 'video' || mode === 'audio' ? 'e.g. Career growth, Marriage timing...' : 'e.g. When will I get a job?...'}
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={3}
              value={question}
              onChangeText={setQuestion}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <Animated.View entering={SlideInBottom} style={styles.footer}>
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>Consultation Fee</ThemedText>
            <ThemedText style={styles.priceValue}>
              ₹{amount.toFixed(2)}
            </ThemedText>
          </View>

          <TouchableOpacity 
            style={[styles.payBtn, loading && styles.disabledBtn]} 
            onPress={handlePayAndSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={mode === 'video' ? 'videocam' : (mode === 'audio' ? 'call' : 'wallet-outline')} size={20} color="#fff" />
                <ThemedText style={styles.payBtnText}>
                  Pay & {mode === 'video' ? 'Start Video Call' : (mode === 'audio' ? 'Start Audio Call' : 'Send Question')}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
          <ThemedText style={styles.secureText}>
            <Ionicons name="shield-checkmark" size={12} color="#00d1b2" /> Secure Dummy Payment
          </ThemedText>
        </Animated.View>
      </KeyboardAvoidingView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
    backgroundColor: 'rgba(5, 5, 16, 0.8)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#00cec9',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  inputContainer: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    color: '#fff',
    fontSize: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#0a0a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    flex: 1,
  },
  priceValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  payBtn: {
    backgroundColor: '#6c5ce7',
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#6c5ce7',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secureText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
