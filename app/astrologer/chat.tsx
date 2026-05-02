import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Image, Modal, Alert, Dimensions, Animated, Platform, PermissionsAndroid, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  VideoSourceType,
  RtcSurfaceView,
} from 'react-native-agora';

const { width } = Dimensions.get('window');
const BASE_URL = 'http://10.73.33.139:8000/api';
const AGORA_APP_ID = '06af53400dc9416b81d3460206df9239';

type Message = {
  id: string;
  sender: 'user' | 'astrologer';
  type: 'text' | 'voice' | 'call_request';
  content: string;
  time: string;
  duration?: number;
  callType?: 'audio' | 'video';
  status?: 'pending' | 'accepted' | 'rejected';
};

const RasiCell = ({ idx, name, chartData, gridSize, isCenter = false }: any) => {
  if (isCenter) return <View style={[styles.cell, styles.centerCell, { width: gridSize, height: gridSize }]} />;
  
  const planets: string[] = [];
  if (chartData && idx !== undefined) {
    Object.entries(chartData).forEach(([pName, data]: [string, any]) => {
      if (data.rasi === idx) {
        planets.push(pName.substring(0, 2));
      }
    });
  }

  return (
    <View style={[styles.cell, { width: gridSize, height: gridSize }]}>
      <Text style={styles.rasiInitial}>{name}</Text>
      <View style={styles.cellPlanets}>
        {planets.map((p, i) => (
          <Text key={i} style={styles.cellPlanetText}>{p}</Text>
        ))}
      </View>
    </View>
  );
};

export default function ConsultationChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'astrologer', type: 'text', content: `Vanakkam! I am ${params.name}. How can I guide you today? 🙏`, time: '10:00 AM' },
  ]);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const recordAnim = useRef(new Animated.Value(1)).current;
  const recordInterval = useRef<any>(null);
  const callInterval = useRef<any>(null);
  const autoStartHandled = useRef(false);
  const engine = useRef<IRtcEngine | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(false);

  const GRID_SIZE = (width - 60) / 4;

  useEffect(() => {
    loadExpertProfile();
  }, []);

  const loadExpertProfile = async () => {
    const userData = await AsyncStorage.getItem('user_data');
    if (userData) setUser(JSON.parse(userData));
  };

  const fetchClientChart = async () => {
    setChartLoading(true);
    try {
      // In a real app, we'd fetch based on params.clientId
      // For now, using the cached birth_details for demo/stability
      const birthDetails = await AsyncStorage.getItem('birth_details');
      if (!birthDetails) return;
      const details = JSON.parse(birthDetails);
      const queryParams = new URLSearchParams({
        day: String(Number(details.day)),
        month: String(Number(details.month)),
        year: String(Number(details.year)),
        hour: String(Number(details.hour)),
        minute: String(Number(details.minute)),
        lang: 'ta'
      }).toString();

      const response = await fetch(`http://10.73.33.139:8000/api/astrology/chart?${queryParams}`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
      });
      const contentType = response.headers.get('content-type');
      
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error('Server returned an error. Please ensure Laravel is running.');
      }

      const json = await response.json();
      if (json.success && json.data) {
        setChartData(json.data.chart || null);
      }
    } catch (e: any) {
      console.error('Failed to fetch client chart:', e);
      Alert.alert('Astral Error', 'Could not reach the astrology engine. Please check your server connection.');
      setShowChartModal(false);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (showChartModal && !chartData) {
        fetchClientChart();
    }
  }, [showChartModal]);

  // Initialize Agora Engine
  useEffect(() => {
    if (Platform.OS === 'android') {
        requestAndroidPermissions();
    }
    setupAgora();
    return () => {
      engine.current?.release();
    };
  }, []);

  const requestAndroidPermissions = async () => {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    } catch (err) {
      console.warn(err);
    }
  };

  const setupAgora = async () => {
    try {
      engine.current = createAgoraRtcEngine();
      engine.current.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          setIsJoined(true);
        },
        onUserJoined: (connection, uid, elapsed) => {
          setRemoteUid(uid);
        },
        onUserOffline: (connection, uid, reason) => {
          setRemoteUid(null);
        },
        onLeaveChannel: (connection, stats) => {
          setIsJoined(false);
          setRemoteUid(null);
        },
      });

      engine.current.enableVideo();
      engine.current.startPreview();
    } catch (e) {
      console.error('Agora Setup Error:', e);
    }
  };

  // Auto-start call if requested via params
  useEffect(() => {
    if (params.startCall === 'true' && params.mode && !autoStartHandled.current) {
      autoStartHandled.current = true;
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        initiateCall(params.mode as 'audio' | 'video');
      }, 500);
    }

    if (params.initialMessage && !autoStartHandled.current) {
        autoStartHandled.current = true;
        setTimeout(() => {
            const msg: Message = {
                id: Date.now().toString(),
                sender: 'user',
                type: 'text',
                content: params.initialMessage as string,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, msg]);
            
            // Simulate AI reply
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'astrologer',
                    type: 'text',
                    content: 'I have analyzed your request based on your birth chart. Here is what the stars indicate...',
                    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                }]);
            }, 2000);
        }, 500);
    }
  }, [params.startCall, params.mode, params.initialMessage]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(recordAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
      recordInterval.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } else {
      recordAnim.stopAnimation();
      recordAnim.setValue(1);
      clearInterval(recordInterval.current);
      setRecordSeconds(0);
    }
    return () => clearInterval(recordInterval.current);
  }, [isRecording]);

  const fetchChatHistory = async () => {
    try {
        const res = await fetch(`${BASE_URL}/chat/history?user_id=${params.clientId}&astrologer_id=${user.id}`, {
            headers: { 'Accept': 'application/json' }
        });
        const json = await res.json();
        if (json.success && json.messages.length > 0) {
            const formatted = json.messages.map((m: any) => ({
                id: m.id.toString(),
                sender: m.sender_id === user.id ? 'astrologer' : 'user',
                type: m.type,
                content: m.content,
                time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                duration: m.duration
            }));
            setMessages(formatted);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    } catch (e) {
        console.error('History Fetch Error:', e);
    }
  };

  useEffect(() => {
    if (user && params.clientId) {
        fetchChatHistory();
    }
  }, [user, params.clientId]);

  const sendTextMessage = async () => {
    if (!text.trim()) return;
    const msgContent = text.trim();
    setText('');

    // Save locally
    const localMsg: Message = {
      id: Date.now().toString(),
      sender: 'astrologer',
      type: 'text',
      content: msgContent,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, localMsg]);

    // Save to DB
    try {
        await fetch(`${BASE_URL}/chat/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                sender_id: user.id,
                receiver_id: params.clientId,
                content: msgContent,
                type: 'text',
                consultation_id: params.consultationId || 1
            })
        });
    } catch (e) {
        console.error('Message Save Error:', e);
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording & send
      setIsRecording(false);
      const duration = recordSeconds;
      
      // Save locally
      const localMsg: Message = {
        id: Date.now().toString(),
        sender: 'astrologer', // Experts send voice too
        type: 'voice',
        content: 'Voice message',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration,
      };
      setMessages(prev => [...prev, localMsg]);

      // Save to DB
      try {
          await fetch(`${BASE_URL}/chat/save`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({
                  sender_id: user.id,
                  receiver_id: params.clientId,
                  content: 'Voice message',
                  type: 'voice',
                  duration: duration,
                  consultation_id: params.consultationId || 1
              })
          });
      } catch (e) {
          console.error('Voice Save Error:', e);
      }

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      setIsRecording(true);
    }
  };

  const initiateCall = async (type: 'audio' | 'video') => {
    setCallType(type);
    setShowCallModal(false);

    const msg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'call_request',
      content: `${type === 'audio' ? '📞 Audio' : '📹 Video'} Call Request`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      callType: type,
      status: 'pending',
    };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Fetch real Agora token from Laravel backend
      const channelName = `astromind_${params.id}_${Date.now()}`;
      const res = await fetch(`${BASE_URL}/consultation/call-token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ channel: channelName, uid: 0 }),
      });
      
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse token response:', text);
        throw new Error('Invalid server response');
      }

      if (json.success) {
        // Join Agora Channel
        engine.current?.joinChannel(json.token, json.channel, 0, {
          clientRoleType: ClientRoleType.ClientRolePublisher,
        });

        // Mark as accepted and start timer
        setMessages(prev => prev.map(m =>
          m.type === 'call_request' && m.status === 'pending'
            ? { ...m, status: 'accepted' }
            : m
        ));
        setInCall(true);
        callInterval.current = setInterval(() => setCallTimer(t => t + 1), 1000);

        // Alert.alert(
        //   `${type === 'video' ? '📹 Video' : '📞 Audio'} Call Started`,
        //   `Channel: ${json.channel}\nToken ready. In production, Agora SDK will connect automatically.`
        // );
      }
    } catch (e) {
      console.error('Call Initiation Error:', e);
      // Simulate for development if backend unreachable
      setMessages(prev => prev.map(m =>
        m.type === 'call_request' && m.status === 'pending'
          ? { ...m, status: 'accepted' }
          : m
      ));
      setInCall(true);
      callInterval.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    }
  };

  const endCall = async () => {
    engine.current?.leaveChannel();
    clearInterval(callInterval.current);
    setInCall(false);
    
    const totalSeconds = callTimer;
    const totalMinutes = Math.max(1, Math.ceil(totalSeconds / 60));
    const pricePerMin = parseInt(params.price as string) || 10;
    const totalCost = totalMinutes * pricePerMin;

    // Save Session to DB
    try {
        await fetch(`${BASE_URL}/consultation/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                consultation_id: params.consultationId || 1,
                duration: totalSeconds,
                amount: totalCost
            })
        });
    } catch (e) {
        console.error('Session End Error:', e);
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'astrologer',
      type: 'text',
      content: `Call Summary:\n⏱️ Duration: ${formatTime(totalSeconds)}\n💰 Total Cost: ₹${totalCost} (at ₹${pricePerMin}/min)\n\nThe amount will be deducted from your wallet. Thank you for the consultation! 🙏`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }]);
    
    setCallTimer(0);
    setCallType(null);

    // Show rating modal after 1.5 seconds
    setTimeout(() => {
        setShowRatingModal(true);
    }, 1500);
  };

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    engine.current?.muteLocalAudioStream(newState);
  };

  const toggleCamera = () => {
    const newState = !isCameraOff;
    setIsCameraOff(newState);
    engine.current?.muteLocalVideoStream(newState);
  };

  const flipCamera = () => {
    engine.current?.switchCamera();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <CosmicBackground>
      <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: params.avatar as string }} style={styles.headerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{params.name}</Text>
            <View style={styles.headerStatus}>
              <View style={[styles.statusDot, { backgroundColor: params.online === 'true' ? '#00b894' : '#555' }]} />
              <Text style={styles.statusText}>{params.online === 'true' ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          {/* EXPERT ONLY: Delete Chat */}
          <TouchableOpacity 
            onPress={() => {
                Alert.alert('Delete Chat', 'Are you sure you want to delete this consultation history permanently?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => router.back() }
                ]);
            }} 
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#ff7675" />
          </TouchableOpacity>
        </View>

        {/* EXPERT CONTEXT: Auto-Birth Details Sharing */}
        <View style={styles.contextBanner}>
          <View style={styles.contextHeader}>
            <View style={styles.contextLabel}>
              <Ionicons name="sparkles" size={12} color="#ffd700" />
              <Text style={styles.contextLabelText}>ஜாதக விவரங்கள் (Revealed)</Text>
            </View>
            <Text style={styles.contextTime}>4:20 PM</Text>
          </View>

          <View style={styles.contextGrid}>
            <View style={styles.contextItem}>
              <Text style={styles.contextVal}>இராசி</Text>
              <Text style={styles.contextKey}>மேஷம்</Text>
            </View>
            <View style={styles.contextItem}>
              <Text style={styles.contextVal}>நட்சத்திரம்</Text>
              <Text style={styles.contextKey}>அசுவினி</Text>
            </View>
            <View style={styles.contextItem}>
              <Text style={styles.contextVal}>தசா புத்தி</Text>
              <Text style={styles.contextKey}>ராகு / குரு</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewChartBtn} onPress={() => setShowChartModal(true)}>
            <Text style={styles.viewChartText}>முழு ஜாதகம் (ராசி கட்டம்)</Text>
            <Ionicons name="expand-outline" size={14} color="#6c5ce7" />
          </TouchableOpacity>
        </View>

        {/* CHART MODAL (RASI KATTAM) */}
        <Modal visible={showChartModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.chartModalCard}>
              <View style={styles.chartModalHeader}>
                <Text style={styles.chartModalTitle}>பிறப்பு ஜாதகம் (ராசி)</Text>
                <TouchableOpacity onPress={() => setShowChartModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {chartLoading ? (
                <View style={styles.chartLoadingBox}>
                  <ActivityIndicator size="large" color="#6c5ce7" />
                  <Text style={styles.loadingText}>ஜாதகம் கணிக்கப்படுகிறது...</Text>
                </View>
              ) : (
                <View style={styles.rasiKattamWrap}>
                   <View style={styles.chartGrid}>
                    <View style={styles.gridRow}>
                      <RasiCell idx={11} name="மீ" chartData={chartData} gridSize={GRID_SIZE} /><RasiCell idx={0} name="மே" chartData={chartData} gridSize={GRID_SIZE} /><RasiCell idx={1} name="ரி" chartData={chartData} gridSize={GRID_SIZE} /><RasiCell idx={2} name="மி" chartData={chartData} gridSize={GRID_SIZE} />
                    </View>
                    <View style={styles.gridRow}>
                      <RasiCell idx={10} name="கு" chartData={chartData} gridSize={GRID_SIZE} /><View style={{ width: GRID_SIZE * 2, height: GRID_SIZE, backgroundColor: 'rgba(108,92,231,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }} /><RasiCell idx={3} name="கட" chartData={chartData} gridSize={GRID_SIZE} />
                    </View>
                    <View style={styles.gridRow}>
                      <RasiCell idx={9} name="ம" chartData={chartData} gridSize={GRID_SIZE} /><View style={{ width: GRID_SIZE * 2, height: GRID_SIZE, backgroundColor: 'rgba(108,92,231,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }} /><RasiCell idx={4} name="சி" chartData={chartData} gridSize={GRID_SIZE} />
                    </View>
                    <View style={styles.gridRow}>
                      <RasiCell idx={8} name="த" chartData={chartData} gridSize={GRID_SIZE} /><RasiCell idx={7} name="வி" chartData={chartData} gridSize={GRID_SIZE} /><RasiCell idx={6} name="து" chartData={chartData} gridSize={GRID_SIZE} /><RasiCell idx={5} name="க" chartData={chartData} gridSize={GRID_SIZE} />
                    </View>
                  </View>
                  <Text style={styles.expertNote}>* கிரக நிலைகள் தானாகவே கணக்கிடப்பட்டுள்ளன.</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* MESSAGES */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[styles.msgRow, msg.sender === 'user' && styles.msgRowRight]}>
              {msg.sender === 'astrologer' && (
                <Image source={{ uri: params.avatar as string }} style={styles.msgAvatar} />
              )}

              {msg.type === 'text' && (
                <View style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.astroBubble]}>
                  <Text style={styles.bubbleText}>{msg.content}</Text>
                  <Text style={styles.bubbleTime}>{msg.time}</Text>
                </View>
              )}

              {msg.type === 'voice' && (
                <View style={[styles.bubble, styles.userBubble]}>
                  <View style={styles.voiceMsg}>
                    <Ionicons name="play-circle" size={28} color="#fff" />
                    <View style={styles.voiceWave}>
                      {[4, 8, 12, 8, 16, 10, 6, 14, 8, 6, 10, 8].map((h, i) => (
                        <View key={i} style={[styles.waveLine, { height: h }]} />
                      ))}
                    </View>
                    <Text style={styles.voiceDuration}>0:{(msg.duration || 0).toString().padStart(2, '0')}</Text>
                  </View>
                  <Text style={styles.bubbleTime}>{msg.time}</Text>
                </View>
              )}

              {msg.type === 'call_request' && (
                <View style={[styles.bubble, styles.callBubble]}>
                  <Ionicons name={msg.callType === 'audio' ? 'call' : 'videocam'} size={22} color="#6c5ce7" />
                  <Text style={styles.callBubbleText}>{msg.content}</Text>
                  <Text style={[styles.callStatus, { color: msg.status === 'accepted' ? '#00b894' : msg.status === 'rejected' ? '#ff7675' : '#fdcb6e' }]}>
                    {msg.status === 'accepted' ? '✅ Accepted' : msg.status === 'rejected' ? '❌ Declined' : '⏳ Calling...'}
                  </Text>
                  <Text style={styles.bubbleTime}>{msg.time}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* FULL SCREEN VIDEO CALL OVERLAY */}
        {inCall && callType === 'video' && (
          <Modal visible={true} animationType="fade" transparent={false}>
            <View style={styles.fullVideoContainer}>
              {/* REMOTE VIEW (The Client) */}
              {remoteUid ? (
                <RtcSurfaceView
                  canvas={{ uid: remoteUid }}
                  style={styles.remoteVideo}
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <ActivityIndicator size="large" color="#6c5ce7" />
                  <Text style={styles.placeholderText}>Connecting to client...</Text>
                </View>
              )}

              {/* LOCAL VIEW (The Expert - Picture in Picture) */}
              <View style={styles.localVideoContainer}>
                {!isCameraOff ? (
                  <RtcSurfaceView
                    canvas={{ uid: 0 }}
                    style={styles.localVideo}
                  />
                ) : (
                  <View style={[styles.localVideo, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="videocam-off" size={20} color="#333" />
                  </View>
                )}
              </View>

              {/* CONTROLS */}
              <View style={styles.videoControls}>
                <View style={styles.callInfo}>
                  <Text style={styles.callName}>{params.name}</Text>
                  <Text style={styles.callTimer}>{formatTime(callTimer)}</Text>
                </View>
                
                <View style={styles.controlRow}>
                  <TouchableOpacity onPress={toggleMute} style={[styles.controlBtn, isMuted && styles.controlBtnActive]}>
                    <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={endCall} style={styles.hangupBtn}>
                    <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={toggleCamera} style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}>
                    <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={26} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={flipCamera} style={styles.controlBtn}>
                    <Ionicons name="camera-reverse" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ACTIVE AUDIO CALL BANNER */}
        {inCall && callType === 'audio' && (
          <View style={styles.callBanner}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callBannerText}>Audio Call • {formatTime(callTimer)}</Text>
            <TouchableOpacity onPress={endCall} style={styles.endCallBtn}>
              <Ionicons name="call" size={18} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={styles.endCallText}>End</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          {isRecording ? (
            <View style={styles.recordingBar}>
              <Animated.View style={[styles.recordDot, { transform: [{ scale: recordAnim }] }]} />
              <Text style={styles.recordingText}>Recording... {formatTime(recordSeconds)}</Text>
              <TouchableOpacity onPress={handleVoiceRecord} style={styles.stopRecordBtn}>
                <Ionicons name="stop" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={handleVoiceRecord} style={styles.voiceBtn}>
                <Ionicons name="mic" size={22} color="#6c5ce7" />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#555"
                value={text}
                onChangeText={setText}
                multiline
              />
              <TouchableOpacity onPress={sendTextMessage} style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* RATING MODAL */}
        <Modal visible={showRatingModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <Ionicons name="star" size={40} color="#fdcb6e" />
                <Text style={styles.ratingTitle}>Rate Your Experience</Text>
                <Text style={styles.ratingSub}>How was your consultation with {params.name}?</Text>
              </View>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                    <Ionicons 
                      name={star <= userRating ? "star" : "star-outline"} 
                      size={40} 
                      color={star <= userRating ? "#fdcb6e" : "rgba(255,255,255,0.2)"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.submitRatingBtn, userRating === 0 && { opacity: 0.5 }]} 
                onPress={() => {
                  if (userRating === 0) return;
                  setShowRatingModal(false);
                  Alert.alert('Thank You!', 'Your feedback helps us improve our services. 🙏', [
                    { text: 'OK', onPress: () => router.back() }
                  ]);
                }}
                disabled={userRating === 0}
              >
                <Text style={styles.submitRatingText}>Submit Feedback</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => { setShowRatingModal(false); router.back(); }}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* CALL TYPE MODAL */}
        <Modal visible={showCallModal} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCallModal(false)}>
            <View style={styles.callModal}>
              <Text style={styles.callModalTitle}>Start a Call</Text>
              <TouchableOpacity style={styles.callOption} onPress={() => initiateCall('audio')}>
                <View style={[styles.callOptionIcon, { backgroundColor: 'rgba(108,92,231,0.2)' }]}>
                  <Ionicons name="call" size={26} color="#6c5ce7" />
                </View>
                <View>
                  <Text style={styles.callOptionTitle}>Audio Call</Text>
                  <Text style={styles.callOptionSub}>Voice only • Clear quality</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callOption} onPress={() => initiateCall('video')}>
                <View style={[styles.callOptionIcon, { backgroundColor: 'rgba(0,206,201,0.2)' }]}>
                  <Ionicons name="videocam" size={26} color="#00cec9" />
                </View>
                <View>
                  <Text style={styles.callOptionTitle}>Video Call</Text>
                  <Text style={styles.callOptionSub}>Face to face • HD video</Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* VIDEO CALL OVERLAY */}
        {inCall && callType === 'video' && (
          <View style={styles.videoOverlay}>
            {/* Main Video Area */}
            <View style={styles.remoteVideo}>
              {remoteUid ? (
                /* Show Astrologer when they join */
                <RtcSurfaceView
                  canvas={{ uid: remoteUid }}
                  style={{ flex: 1 }}
                />
              ) : (
                /* If Astrologer is not here yet, show Caller Full Screen */
                <RtcSurfaceView
                  canvas={{ uid: 0 }}
                  style={{ flex: 1 }}
                />
              )}
            </View>

            {/* Small Window (Picture in Picture) */}
            {remoteUid && (
              <View style={styles.localVideo}>
                {!isCameraOff ? (
                  <RtcSurfaceView
                    canvas={{ uid: 0 }}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View style={[styles.videoPlaceholder, { backgroundColor: '#111' }]}>
                    <Ionicons name="videocam-off" size={24} color="#555" />
                  </View>
                )}
              </View>
            )}

            {/* If Astrologer not here, show a centered waiting badge at bottom */}
            {!remoteUid && (
              <View style={styles.centeredWaiting}>
                <View style={styles.loadingDot} />
                <Text style={styles.waitingText}>Waiting for {params.name}... ({formatTime(callTimer)})</Text>
              </View>
            )}

            {/* Call Controls Overlay */}
            <View style={styles.videoControls}>
              <View style={styles.videoHeader}>
                {remoteUid && <Text style={styles.videoTimer}>{formatTime(callTimer)}</Text>}
                <Text style={styles.videoName}>{params.name}</Text>
              </View>

              <View style={styles.videoFooter}>
                <TouchableOpacity onPress={toggleMute} style={[styles.videoIconBtn, isMuted && { backgroundColor: '#ff7675' }]}>
                  <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={endCall} style={[styles.videoIconBtn, { backgroundColor: '#ff4757', width: 72, height: 72 }]}>
                  <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleCamera} style={[styles.videoIconBtn, isCameraOff && { backgroundColor: '#ff7675' }]}>
                  <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={26} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Top Right Controls */}
            <View style={styles.topRightControls}>
              <TouchableOpacity onPress={flipCamera} style={styles.topRightBtn}>
                <Ionicons name="camera-reverse" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
       </View>
     </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 55, paddingBottom: 16, backgroundColor: 'rgba(10,10,26,0.98)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#131326', borderWidth: 2, borderColor: '#6c5ce7' },
  headerName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: '#888', fontSize: 12 },
  callIconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,118,117,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  contextBanner: { backgroundColor: 'rgba(108,92,231,0.05)', margin: 10, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(108,92,231,0.15)' },
  contextHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  contextLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  contextLabelText: { color: '#ffd700', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  contextTime: { color: '#555', fontSize: 10, fontWeight: 'bold' },
  contextGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  contextItem: { alignItems: 'flex-start' },
  contextKey: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  contextVal: { color: '#666', fontSize: 10, textTransform: 'uppercase' },
  viewChartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  viewChartText: { color: '#6c5ce7', fontSize: 12, fontWeight: 'bold' },

  // RASI KATTAM STYLES
  cell: { borderSize: 1, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 4, justifyContent: 'space-between' },
  centerCell: { backgroundColor: 'rgba(108,92,231,0.05)', borderWidth: 0 },
  rasiInitial: { color: '#6c5ce7', fontSize: 7, fontWeight: 'bold' },
  cellPlanets: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cellPlanetText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  
  chartModalCard: { backgroundColor: '#0d0d1f', borderRadius: 30, padding: 25, width: width * 0.9, borderWidth: 1, borderColor: 'rgba(108,92,231,0.3)' },
  chartModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartModalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chartLoadingBox: { height: 250, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6c5ce7', fontSize: 14, marginTop: 15, fontWeight: '500' },
  rasiKattamWrap: { alignItems: 'center' },
  chartGrid: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 15, padding: 5, borderWidth: 2, borderColor: '#6c5ce7' },
  gridRow: { flexDirection: 'row' },
  expertNote: { color: '#444', fontSize: 10, marginTop: 15, fontStyle: 'italic', textAlign: 'center' },

  messagesContent: { padding: 15, paddingBottom: 20 },

  // VIDEO CALL STYLES
  fullVideoContainer: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { flex: 1 },
  localVideoContainer: { position: 'absolute', top: 60, right: 20, width: 100, height: 150, borderRadius: 15, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: '#111' },
  localVideo: { flex: 1 },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  placeholderText: { color: '#666', fontSize: 14, marginTop: 15 },
  videoControls: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 30, paddingBottom: 50, backgroundColor: 'rgba(0,0,0,0.4)' },
  controlRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  controlBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  controlBtnActive: { backgroundColor: '#ff7675' },
  hangupBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#ff4757', justifyContent: 'center', alignItems: 'center' },
  callInfo: { alignItems: 'center', marginBottom: 30 },
  callName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  callTimer: { color: '#00cec9', fontSize: 16, fontWeight: 'bold', marginTop: 5 },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  msgRowRight: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#131326' },
  bubble: { maxWidth: width * 0.7, padding: 12, borderRadius: 18 },
  userBubble: { backgroundColor: '#6c5ce7', borderBottomRightRadius: 4 },
  astroBubble: { backgroundColor: 'rgba(255,255,255,0.07)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  callBubble: { backgroundColor: 'rgba(108,92,231,0.1)', borderWidth: 1, borderColor: 'rgba(108,92,231,0.3)', alignItems: 'center', gap: 4 },
  bubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  callBubbleText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  callStatus: { fontSize: 12, fontWeight: 'bold' },
  voiceMsg: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceWave: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveLine: { width: 3, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 2 },
  voiceDuration: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  callBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00b894', paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  callBannerText: { flex: 1, color: '#fff', fontWeight: 'bold', fontSize: 14 },
  endCallBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ff7675', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  endCallText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, backgroundColor: 'rgba(10,10,26,0.98)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  voiceBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(108,92,231,0.1)', justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6c5ce7', justifyContent: 'center', alignItems: 'center' },
  recordingBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,118,118,0.1)', borderRadius: 20, padding: 10 },
  recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff7675' },
  recordingText: { flex: 1, color: '#ff7675', fontWeight: 'bold', fontSize: 14 },
  stopRecordBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ff7675', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  callModal: { backgroundColor: '#0d0d1f', borderRadius: 25, padding: 25, width: width * 0.85, borderWidth: 1, borderColor: 'rgba(108,92,231,0.3)' },
  callModalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  callOption: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, marginBottom: 12 },
  callOptionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  callOptionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  callOptionSub: { color: '#888', fontSize: 12, marginTop: 2 },

  // Video Overlay Styles
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 1000 },
  remoteVideo: { flex: 1 },
  localVideo: { position: 'absolute', top: 60, right: 20, width: 120, height: 180, borderRadius: 15, overflow: 'hidden', backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a1a' },
  placeholderAvatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 20, borderWidth: 3, borderColor: '#6c5ce7' },
  placeholderText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
  videoControls: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 40, paddingBottom: 60 },
  videoHeader: { alignItems: 'center', paddingTop: 20 },
  videoTimer: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  videoName: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  videoFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 25 },
  videoIconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  topRightControls: { position: 'absolute', top: 50, right: 20, gap: 15 },
  topRightBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  centeredWaiting: { position: 'absolute', bottom: 150, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  waitingText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00cec9' },

  // Rating Modal Styles
  ratingCard: { backgroundColor: '#0d0d1f', borderRadius: 30, padding: 30, width: width * 0.85, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(108,92,231,0.3)' },
  ratingHeader: { alignItems: 'center', marginBottom: 25 },
  ratingTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  ratingSub: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  starsContainer: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  submitRatingBtn: { backgroundColor: '#6c5ce7', width: '100%', paddingVertical: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#6c5ce7', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitRatingText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  skipText: { color: '#555', fontSize: 14, marginTop: 20, fontWeight: '500' },
});
