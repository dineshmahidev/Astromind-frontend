import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Image, Alert, Dimensions, ActivityIndicator,
  KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');
let BASE_URL = 'http://10.22.133.139:8000/api';

type ChatMessage = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  type: string;
  created_at: string;
};

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false); 
  const [showDashaList, setShowDashaList] = useState(false);
  const [expandedDasha, setExpandedDasha] = useState<number | null>(null);

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [isInputLocked, setIsInputLocked] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<any>(null);
  const recordingStartRef = useRef<number>(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const consultationId = params.consultationId as string;
  const clientName = (params.name as string) || 'Client';
  const clientId = params.clientId as string;
  const expertUserId = params.expertUserId as string;

  const isExpert = user && (user.role === 'expert' || user.role === 'astrologer' || (expertUserId && String(user.id) === String(expertUserId)));
  const isClient = user && clientId && String(user.id) === String(clientId);

  // Correct receiver detection
  const receiverId = isExpert ? parseInt(clientId) : (parseInt(expertUserId) || 0);

  // Debug log for roles (development only)
  useEffect(() => {
    if (user) {
      console.log('Room1 Roles - UserID:', user.id, 'ExpertID:', expertUserId, 'ClientID:', clientId);
      console.log('isExpert:', isExpert, 'isClient:', isClient);
    }
  }, [user, expertUserId, clientId]);

  // Consultation detail
  const [consultation, setConsultation] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [kattam, setKattam] = useState<any[]>([]);
  const [dashaTimeline, setDashaTimeline] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const savedUrl = await AsyncStorage.getItem('custom_server_url');
      if (savedUrl) BASE_URL = savedUrl;
      const ud = await AsyncStorage.getItem('user_data');
      if (ud) setUser(JSON.parse(ud));
    })();
  }, []);


  const fetchConsultationDetail = async () => {
    if (!consultationId) { setLoading(false); return; }
    try {
      const res = await fetch(`${BASE_URL}/consultation/detail?consultation_id=${consultationId}`);
      const json = await res.json();
      if (json.success) {
        setConsultation(json.consultation);
        setUserProfile(json.user_profile);
        setKattam(json.kattam || []);
        setDashaTimeline(json.dasha_timeline || []);
        setMessages(json.messages || []);
      }
    } catch (e) {
      console.error('Fetch detail error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultationDetail();
    
    // Auto-trigger call if coming from start screen
    if (params.startCall === 'true' && consultationId) {
        setTimeout(() => {
            router.push({
                pathname: '/chat/live',
                params: { consultationId, mode: params.mode || 'audio', name: clientName }
            });
        }, 1000);
    }

    const interval = setInterval(async () => {
      if (!consultationId) return;
      try {
        const res = await fetch(`${BASE_URL}/consultation/messages?consultation_id=${consultationId}`);
        const json = await res.json();
        if (json.success) {
          setMessages(json.messages || []);
          
          // Mark messages as read if there are new ones for us (where we are receiver)
          const hasUnreadIncoming = json.messages.some((m: any) => 
            m.receiver_id === user.id && 
            m.sender_id !== user.id && 
            !m.is_read
          );
          
          if (hasUnreadIncoming) {
            fetch(`${BASE_URL}/chat/mark-read`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ consultation_id: consultationId, user_id: user.id })
            });
          }
        }
      } catch (e) { /* silent */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [consultationId]);

  const sendMessage = async (content?: string, type: 'text' | 'image' | 'voice' = 'text') => {
    const finalContent = content || text.trim();
    if (!finalContent || !user) return;
    if (type === 'text') setText('');
    setSending(true);

    const tempMsg: ChatMessage = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: receiverId,
      content: finalContent, type: type,
      duration: type === 'voice' ? recordingTime : 0,
      is_read: 0,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await fetch(`${BASE_URL}/chat/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: receiverId,
          content: finalContent, type: type,
          consultation_id: parseInt(consultationId) || 1,
          duration: type === 'voice' ? recordingTime : 0,
        }),
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      sendMessage(base64Image, 'image');
    }
  };

  const isRecordingRef = useRef(false);

  const startRecording = async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);

    try {
      // Force reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        setRecording(newRecording);
        setRecordingTime(0);
        
        recordingStartRef.current = Date.now();
        if (recordingInterval.current) clearInterval(recordingInterval.current);
        recordingInterval.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
          setRecordingTime(elapsed);
        }, 1000);
      } else {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecording(null);
    }
  };

  const stopRecording = async () => {
    if (!isRecordingRef.current) return;
    
    // Small delay to ensure minimum recording time and avoid rapid toggle crash
    setTimeout(async () => {
      try {
        if (recording) {
          if (recordingInterval.current) clearInterval(recordingInterval.current);
          
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          const finalTime = Math.max(1, Math.floor((Date.now() - recordingStartRef.current) / 1000));
          
          setRecording(null);
          setRecordingTime(0);
          isRecordingRef.current = false;
          setIsRecording(false);
          
          if (uri && finalTime >= 1) {
              const voiceData = JSON.stringify({ uri, duration: finalTime });
              sendMessage(voiceData, 'voice');
          }
        } else {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      } catch (e) {
        console.error('Stop recording error:', e);
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    }, 500); // 500ms safety buffer
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playVoice = async (uri: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (e) {
      console.error('Play voice error:', e);
    }
  };

  const submitReview = async () => {
    try {
      const res = await fetch(`${BASE_URL}/consultation/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultation_id: consultationId,
          rating: rating,
          review: reviewText,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedbackGiven(true);
        setShowReviewModal(false);
        Alert.alert('Thank You!', 'Your review has been submitted.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  const formatTime = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const renderKattam = () => {
    if (!kattam || !Array.isArray(kattam) || kattam.length < 12) return null;

    // South Indian 4x4 grid layout house indices (0-based)
    const gridPositions = [
      [11, 0, 1, 2],
      [10, null, null, 3],
      [9, null, null, 4],
      [8, 7, 6, 5],
    ];

    const planetSymbols: any = { 'Sun': 'Su', 'Moon': 'Mo', 'Mars': 'Ma', 'Mercury': 'Me', 'Jupiter': 'Ju', 'Venus': 'Ve', 'Saturn': 'Sa', 'Rahu': 'Ra', 'Ketu': 'Ke', 'Lagna': 'As' };

    // Add Lagna to the house if available
    if (userProfile?.lagnam) {
      const lagnaRasi = userProfile.lagnam; 
      const rasiList = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      const rasiListTamil = ['Mesham', 'Rishabam', 'Mithunam', 'Kadagam', 'Simmam', 'Kanni', 'Thulaam', 'Virutchigam', 'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'];
      
      let lagnaIdx = rasiList.indexOf(lagnaRasi);
      if (lagnaIdx === -1) lagnaIdx = rasiListTamil.indexOf(lagnaRasi);

      if (lagnaIdx !== -1 && !kattam[lagnaIdx].includes('Lagna')) {
        kattam[lagnaIdx] = [...kattam[lagnaIdx], 'Lagna'];
      }
    }

    return (
      <View style={s.kattamGrid}>
        {gridPositions.map((row, ri) => (
          <View key={ri} style={s.kattamRow}>
            {row.map((houseIdx, ci) => {
              // Standard House Cell
              if (houseIdx !== null) {
                const planets = kattam[houseIdx] || [];
                return (
                  <View key={`${ri}-${ci}`} style={s.kattamCell}>
                    <Text style={s.kattamHouseNum}>{houseIdx + 1}</Text>
                    {/* Diagonal line indicator for Lagna if present */}
                    {planets.includes('Lagna') && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(255, 69, 58, 0.3)', transform: [{ rotate: '45deg' }, { scale: 1.5 }] }} />
                    )}
                    <View style={s.planetWrap}>
                      {planets.map((p, pi) => (
                        <Text 
                          key={pi} 
                          style={[
                            s.kattamPlanets, 
                            p === 'Lagna' && { color: '#ff453a', backgroundColor: 'rgba(255, 69, 58, 0.15)', borderColor: '#ff453a' }
                          ]}
                        >
                          {planetSymbols[p] || p}
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              }
              
              // Center Cells (1,1), (1,2), (2,1), (2,2)
              // Only render content in the top-left of the center
              if (ri === 1 && ci === 1) {
                return (
                  <View key={`${ri}-${ci}`} style={[s.kattamCell, s.kattamCenter, { borderBottomWidth: 0, borderRightWidth: 0 }]}>
                    <Text style={s.kattamCenterText}>ராசி</Text>
                  </View>
                );
              }
              if (ri === 1 && ci === 2) {
                return <View key={`${ri}-${ci}`} style={[s.kattamCell, s.kattamCenter, { borderBottomWidth: 0, borderLeftWidth: 0 }]} />;
              }
              if (ri === 2 && ci === 1) {
                return (
                  <View key={`${ri}-${ci}`} style={[s.kattamCell, s.kattamCenter, { borderTopWidth: 0, borderRightWidth: 0 }]}>
                    <Text style={s.kattamCenterSub}>{userProfile?.rasi || ''}</Text>
                  </View>
                );
              }
              if (ri === 2 && ci === 2) {
                return <View key={`${ri}-${ci}`} style={[s.kattamCell, s.kattamCenter, { borderTopWidth: 0, borderLeftWidth: 0 }]} />;
              }
              
              return <View key={`${ri}-${ci}`} style={s.kattamCell} />;
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Profile Pic */}
        <View style={s.avatarContainer}>
          {(() => {
            const avatarPath = isExpert ? consultation?.user_avatar : consultation?.expert_avatar;
            const avatarUrl = avatarPath ? (avatarPath.startsWith('http') ? avatarPath : `http://10.22.133.139:8000/storage/${avatarPath}`) : null;
            const isPlaceholder = !avatarUrl || avatarUrl.includes('pravatar.cc');
            
            return isPlaceholder ? (
              <View style={[s.headerAvatar, s.avatarPlaceholder]}>
                <Ionicons name="person-circle" size={30} color="#8696a0" />
              </View>
            ) : (
              <Image source={{ uri: avatarUrl }} style={s.headerAvatar} />
            );
          })()}
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.headerName} numberOfLines={1}>
            {isExpert ? `${clientName} (${userProfile?.age || '—'} yrs)` : clientName}
          </Text>
          <Text style={s.headerStatus}>
            {isExpert ? (userProfile?.current_dasha ? `${userProfile.current_dasha} Dasha • ${userProfile.current_bhukti} Bhukti` : 'Astrologer Panel') : 'Consultation Session'}
          </Text>
        </View>
        
        {/* Call Buttons (Available for both if active) */}
        <TouchableOpacity 
          style={[s.viewAstroBtn, { backgroundColor: '#6c5ce7', marginRight: 8 }]} 
          onPress={() => router.push({
            pathname: '/chat/live',
            params: { consultationId, mode: 'audio', name: clientName }
          })}
        >
          <Ionicons name="call" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.viewAstroBtn, { backgroundColor: '#6c5ce7', marginRight: 8 }]} 
          onPress={() => router.push({
            pathname: '/chat/live',
            params: { consultationId, mode: 'video', name: clientName }
          })}
        >
          <Ionicons name="videocam" size={18} color="#fff" />
        </TouchableOpacity>

        {/* View Astro Detail Button - Always show for now to ensure visibility */}
        <TouchableOpacity onPress={() => setShowProfile(!showProfile)} style={s.viewAstroBtn}>
          <Text style={s.viewAstroText}>{showProfile ? 'Hide' : 'View'}</Text>
          <Ionicons name={showProfile ? 'eye-off' : 'eye'} size={16} color="#fff" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>

      {/* Payment/Status Banner */}
      <View style={{ backgroundColor: 'rgba(108, 92, 231, 0.1)', paddingVertical: 4, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(108, 92, 231, 0.2)' }}>
        <Text style={{ color: '#6c5ce7', fontSize: 11, fontWeight: 'bold' }}>
          {isExpert ? `Paid: ₹${consultation?.amount_paid || 0} • Session Active` : `Session ID: #${consultationId}`}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6c5ce7" />
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            onContentSizeChange={() => !showProfile && scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {/* ASTRO DETAILS (Expert Only) */}
            {isExpert && showProfile && userProfile && (
              <View style={s.profileCard}>
                <View style={s.infoGrid}>
                  <InfoItem icon="calendar" label="DOB" value={userProfile.dob} />
                  <InfoItem icon="time" label="TOB" value={userProfile.tob} />
                  <InfoItem icon="star" label="Rasi" value={userProfile.rasi} />
                  <InfoItem icon="sparkles" label="Star" value={userProfile.nakshatra} />
                  <InfoItem icon="footsteps" label="Padam" value={userProfile.padam} />
                  <InfoItem icon="sunny" label="Lagna" value={userProfile.lagnam} />
                </View>

                {/* Rasi Chart */}
                <View style={s.chartSection}>
                  <Text style={s.sectionLabel}>📊 Rasi Kattam</Text>
                  {renderKattam()}
                </View>

                {/* Dasha Timeline */}
                {dashaTimeline.length > 0 && (
                  <View style={s.chartSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={s.sectionLabel}>🕐 Dasha & Bhukti</Text>
                      <TouchableOpacity onPress={() => setShowDashaList(!showDashaList)}>
                        <Text style={{ color: '#6c5ce7', fontSize: 12, fontWeight: 'bold' }}>
                          {showDashaList ? 'Hide All' : 'View Full Timeline'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {!showDashaList && (
                      <View style={[s.dashaBlock, s.dashaActive]}>
                        <Text style={[s.dashaLord, { color: '#ffd700' }]}>
                          Current: {userProfile.current_dasha} Dasha
                        </Text>
                        <Text style={s.dashaPeriod}>Active now: {userProfile.current_bhukti} Bhukti</Text>
                      </View>
                    )}

                    {showDashaList && dashaTimeline.map((d: any, i: number) => {
                      const isCurrentDasha = userProfile.current_dasha === d.planet;
                      const isExpanded = expandedDasha === i;
                      return (
                        <View key={i} style={[s.dashaBlock, isCurrentDasha && s.dashaActive]}>
                          <TouchableOpacity style={s.dashaHeader} onPress={() => setExpandedDasha(isExpanded ? null : i)}>
                            <View style={{ flex: 1 }}>
                              <Text style={[s.dashaLord, isCurrentDasha && { color: '#ffd700' }]}>{d.planet} Dasha</Text>
                              <Text style={s.dashaPeriod}>{d.start} - {d.end}</Text>
                            </View>
                            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={isCurrentDasha ? '#ffd700' : '#555'} />
                          </TouchableOpacity>
                          {(isExpanded || isCurrentDasha) && d.bhuktis && (
                            <View style={s.bhuktiList}>
                              {d.bhuktis.map((b: any, bi: number) => {
                                const isCurrentBhukti = userProfile.current_bhukti === b.planet && isCurrentDasha;
                                return (
                                  <View key={bi} style={[s.bhuktiRow, isCurrentBhukti && s.bhuktiActive]}>
                                    <Text style={[s.bhuktiName, isCurrentBhukti && { color: '#00ff88' }]}>{b.planet} Bhukti</Text>
                                    <Text style={s.bhuktiPeriod}>{b.start} - {b.end}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* User Question */}
            {consultation?.question && (
              <View style={s.questionBanner}>
                <Text style={s.questionLabel}>SESSION GOAL:</Text>
                <Text style={s.questionText}>{consultation.question}</Text>
              </View>
            )}

            {/* Messages */}
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View key={msg.id} style={[s.msgRow, isMe ? s.msgRight : s.msgLeft]}>
                  <View style={[s.bubble, isMe ? s.myBubble : s.theirBubble]}>
                    {msg.type === 'image' ? (
                      <TouchableOpacity onPress={() => setSelectedImage(msg.content)}>
                        <Image source={{ uri: msg.content }} style={s.msgImage} />
                      </TouchableOpacity>
                    ) : msg.type === 'voice' ? (
                      <VoiceMessagePlayer content={msg.content} isMe={isMe} />
                    ) : (
                      <Text style={s.bubbleText}>{msg.content}</Text>
                    )}
                    <View style={s.bubbleFooter}>
                      <Text style={s.timeText}>{formatTime(msg.created_at)}</Text>
                      {isMe && (
                        <View style={{ marginLeft: 4 }}>
                          {msg.is_read ? (
                            <Ionicons name="checkmark-done" size={16} color="#34b7f1" />
                          ) : (
                            <Ionicons name="checkmark-done" size={16} color="#8696a0" />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Session Over Banner */}
          {consultation?.status === 'closed' && (
            <View style={s.closedBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#6c5ce7" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.closedTitle}>
                  {isExpert ? "Session Completed! ₹10 Received" : "Consultation Closed"}
                </Text>
                {isExpert && (
                  <Text style={s.closedSub}>
                    Payment credited to your wallet.
                  </Text>
                )}
              </View>
              <TouchableOpacity style={s.backToDash} onPress={() => router.back()}>
                <Text style={s.backToDashText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Feedback Bar (Client Only - when expert has replied) */}
          {isClient && consultation?.status !== 'closed' && messages.some(m => m.sender_id !== user.id) && !feedbackGiven && (
            <View style={s.feedbackBar}>
              <Text style={s.feedbackText}>Was this consultation helpful?</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={s.feedbackBtn} onPress={() => { setShowReviewModal(true); setIsInputLocked(false); }}>
                  <Ionicons name="happy" size={18} color="#fff" />
                  <Text style={s.feedbackBtnText}>OK</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[s.feedbackBtn, { backgroundColor: '#3b4a54' }]} 
                  onPress={() => {
                    setIsInputLocked(false);
                    Alert.alert('Unlocked', 'You can now ask another question.');
                  }}
                >
                  <Ionicons name="sad" size={18} color="#fff" />
                  <Text style={s.feedbackBtnText}>Not OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      {/* Input */}
      {consultation?.status !== 'closed' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.inputBar, isInputLocked && { opacity: 0.5 }]}>
            <TouchableOpacity onPress={pickImage} style={{ marginRight: 10 }} disabled={isInputLocked}>
              <Ionicons name="image-outline" size={24} color={isInputLocked ? "#555" : "#6c5ce7"} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPressIn={startRecording} 
              onPressOut={stopRecording} 
              style={{ marginRight: 10 }} 
              disabled={isInputLocked}
            >
              <Ionicons name={isRecording ? "stop-circle" : "mic"} size={24} color={isRecording ? "#ff4b2b" : (isInputLocked ? "#555" : "#6c5ce7")} />
            </TouchableOpacity>
            {isRecording ? (
              <View style={s.recordingContainer}>
                <View style={s.waveDot} />
                <Text style={s.recordingTimeText}>Recording {formatRecordingTime(recordingTime)}</Text>
                <Text style={s.releaseText}>Release to send</Text>
              </View>
            ) : (
              <TextInput
                style={s.input}
                placeholder={isInputLocked ? "Please give feedback to continue..." : "Type reply..."}
                placeholderTextColor="#8696a0"
                value={text}
                onChangeText={setText}
                multiline
                editable={!isInputLocked}
              />
            )}
            <TouchableOpacity 
              onPress={() => sendMessage()} 
              style={[s.sendBtn, isInputLocked && { backgroundColor: '#3b4a54' }]}
              disabled={isInputLocked}
            >
              <Ionicons name={text.trim() ? "send" : "happy-outline"} size={20} color={isInputLocked ? "#555" : "#fff"} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={s.imagePreviewOverlay}>
          <TouchableOpacity 
            activeOpacity={1} 
            style={s.imagePreviewBackdrop} 
            onPress={() => setSelectedImage(null)} 
          />
          <Animated.View entering={FadeInUp} style={s.imagePreviewContainer}>
            <Image source={{ uri: selectedImage || '' }} style={s.fullImage} resizeMode="contain" />
            <TouchableOpacity style={s.closeImageBtn} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={s.imageActionRow}>
              <TouchableOpacity style={s.imageActionBtn} onPress={() => Alert.alert('Coming Soon', 'Image download feature is being implemented.')}>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={s.imageActionText}>Save</Text>
              </TouchableOpacity>
              <View style={s.divider} />
              <TouchableOpacity style={s.imageActionBtn} onPress={() => setSelectedImage(null)}>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={s.imageActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Review Modal */}
      {showReviewModal && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Rate Your Experience</Text>
            <View style={s.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons name={s <= rating ? "star" : "star-outline"} size={32} color="#ffd700" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.reviewInput}
              placeholder="Share your thoughts about this consultation..."
              placeholderTextColor="#8696a0"
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#3b4a54' }]} onPress={() => setShowReviewModal(false)}>
                <Text style={s.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtn} onPress={submitReview}>
                <Text style={s.modalBtnText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const VoiceMessagePlayer = ({ content, isMe }: any) => {
  const [playing, setPlaying] = useState(false);
  const [currentPos, setCurrentPos] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  let uri = content;
  let duration = 0;
  try {
    if (content.startsWith('{')) {
      const data = JSON.parse(content);
      uri = data.uri;
      duration = data.duration;
    }
  } catch (e) {}

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentPos(Math.floor(status.positionMillis / 1000));
      if (status.didJustFinish) {
        setPlaying(false);
        setCurrentPos(0);
      }
    }
  };

  const togglePlay = async () => {
    try {
      if (playing) {
        await soundRef.current?.pauseAsync();
        setPlaying(false);
      } else {
        if (soundRef.current) {
          await soundRef.current.playFromPositionAsync(0);
        } else {
          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );
          soundRef.current = sound;
        }
        setPlaying(true);
      }
    } catch (e) {
      console.error('Playback error:', e);
    }
  };

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity style={s.voiceContainer} onPress={togglePlay}>
      <Ionicons name={playing ? "pause" : "play"} size={22} color="#fff" />
      <View style={s.waveWrapper}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => {
          const active = playing && (i / 15) <= (currentPos / duration);
          return (
            <View 
              key={i} 
              style={[
                s.waveBar, 
                { height: 8 + (Math.sin(i * 0.5) * 5) + (Math.random() * 3) },
                active && { backgroundColor: '#ffd700', transform: [{ scaleY: 1.2 }] }
              ]} 
            />
          );
        })}
      </View>
      <Text style={s.voiceTime}>
        {playing || currentPos > 0 ? `${formatTime(currentPos)} / ` : ''}{formatTime(duration)}
      </Text>
    </TouchableOpacity>
  );
};

const InfoItem = ({ icon, label, value }: any) => (
  <View style={s.infoItem}>
    <Ionicons name={icon} size={12} color="#6c5ce7" />
    <Text style={s.infoLabel}>{label}:</Text>
    <Text style={s.infoValue}>{value || '—'}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b141a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 50, paddingBottom: 15, backgroundColor: '#202c33' },
  backBtn: { padding: 5 },
  avatarContainer: { marginLeft: 5 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: '#3b4a54', justifyContent: 'center', alignItems: 'center' },
  headerName: { color: '#e9edef', fontWeight: 'bold', fontSize: 16 },
  headerStatus: { color: '#6c5ce7', fontSize: 11 },
  viewAstroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6c5ce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  viewAstroText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  profileCard: { backgroundColor: '#1a2530', borderRadius: 12, padding: 12, marginBottom: 15 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  infoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 6, borderRadius: 8, minWidth: '48%' },
  infoLabel: { color: '#8696a0', fontSize: 10, marginLeft: 4 },
  infoValue: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },

  chartSection: { marginTop: 15 },
  sectionLabel: { color: '#ffd700', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  kattamGrid: { 
    width: 280, 
    height: 280, 
    alignSelf: 'center', 
    backgroundColor: '#1c2732',
    borderRadius: 12,
    borderWidth: 2, 
    borderColor: '#d4af37', // Gold color
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  kattamRow: { flex: 1, flexDirection: 'row' },
  msgImage: { width: 200, height: 200, borderRadius: 8, marginBottom: 5 },
  voiceContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 5, minWidth: 150 },
  waveWrapper: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1, height: 25 },
  waveBar: { width: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 },
  voiceTime: { color: '#8696a0', fontSize: 11, fontWeight: 'bold' },
  attachBtn: { padding: 8 },
  kattamCell: { 
    flex: 1, 
    borderWidth: 0.5, 
    borderColor: 'rgba(212, 175, 55, 0.3)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  kattamCenter: { 
    backgroundColor: 'rgba(212, 175, 55, 0.08)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)'
  },
  kattamCenterText: { 
    color: '#d4af37', 
    fontWeight: '900', 
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  kattamCenterSub: { 
    color: '#8696a0', 
    fontSize: 10,
    marginTop: 2,
    fontWeight: 'bold'
  },
  kattamHouseNum: { 
    color: 'rgba(212, 175, 55, 0.4)', 
    fontSize: 9, 
    position: 'absolute', 
    top: 4, 
    left: 6,
    fontWeight: 'bold'
  },
  planetWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 4 
  },
  kattamPlanets: { 
    color: '#ffffff', 
    fontSize: 11, 
    fontWeight: 'bold',
    backgroundColor: 'rgba(108, 92, 231, 0.4)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)'
  },

  dashaBlock: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 8, marginBottom: 5 },
  dashaActive: { borderColor: '#ffd700', borderWidth: 1 },
  dashaHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  dashaLord: { color: '#e9edef', fontSize: 12, fontWeight: 'bold' },
  dashaPeriod: { color: '#8696a0', fontSize: 10 },
  bhuktiList: { marginTop: 5, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#333' },
  bhuktiRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  bhuktiActive: { backgroundColor: 'rgba(108, 92, 231, 0.1)', borderRadius: 4, paddingHorizontal: 5 },
  bhuktiName: { color: '#8696a0', fontSize: 11 },
  bhuktiPeriod: { color: '#555', fontSize: 9 },

  questionBanner: { backgroundColor: 'rgba(255,215,0,0.1)', padding: 12, borderRadius: 10, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#ffd700' },
  questionLabel: { color: '#ffd700', fontSize: 10, fontWeight: 'bold' },
  questionText: { color: '#fff', fontSize: 14, marginTop: 4 },

  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRight: { justifyContent: 'flex-end' },
  msgLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '85%', padding: 10, borderRadius: 12 },
  myBubble: { backgroundColor: '#6c5ce7' },
  theirBubble: { backgroundColor: '#202c33' },
  bubbleText: { color: '#fff', fontSize: 15 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  timeText: { color: '#8696a0', fontSize: 10, textAlign: 'right', marginTop: 4 },

  inputBar: { flexDirection: 'row', padding: 10, backgroundColor: '#202c33', alignItems: 'center', minHeight: 60 },
  input: { flex: 1, backgroundColor: '#2a3942', borderRadius: 20, color: '#fff', paddingHorizontal: 15, paddingVertical: 8, maxHeight: 100 },
  recordingContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a3942', borderRadius: 20, paddingHorizontal: 15, height: 40 },
  recordingTimeText: { color: '#ff4b2b', fontSize: 14, fontWeight: 'bold', marginLeft: 10, flex: 1 },
  releaseText: { color: '#8696a0', fontSize: 12 },
  waveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff4b2b' },
  sendBtn: { marginLeft: 10, backgroundColor: '#6c5ce7', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  feedbackBar: { backgroundColor: '#1a2530', padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedbackText: { color: '#e9edef', fontSize: 13, fontWeight: 'bold' },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6c5ce7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 5 },
  feedbackBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  closedBanner: { backgroundColor: '#1a2530', padding: 15, borderTopWidth: 1, borderTopColor: '#6c5ce7', flexDirection: 'row', alignItems: 'center' },
  closedTitle: { color: '#e9edef', fontSize: 14, fontWeight: 'bold' },
  closedSub: { color: '#6c5ce7', fontSize: 11, marginTop: 2 },
  backToDash: { backgroundColor: '#6c5ce7', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  backToDashText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 20 },
  modalContent: { backgroundColor: '#202c33', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  starRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  reviewInput: { backgroundColor: '#2a3942', borderRadius: 16, width: '100%', color: '#fff', padding: 15, minHeight: 120, textAlignVertical: 'top', marginBottom: 20 },
  modalBtn: { flex: 1, backgroundColor: '#6c5ce7', height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  imagePreviewOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    zIndex: 2000, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imagePreviewBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  imagePreviewContainer: {
    width: '95%',
    height: '85%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeImageBtn: { 
    position: 'absolute', 
    top: 20, 
    right: 20, 
    zIndex: 2001, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fullImage: { 
    width: '100%', 
    height: '100%',
  },
  imageActionRow: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
