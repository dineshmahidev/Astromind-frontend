import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Image, Modal, Alert, Dimensions, Animated, Platform
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
  const callInterval = useRef<any>(null);
  const autoStartHandled = useRef(false);
  const engine = useRef<IRtcEngine | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  // Initialize Agora Engine
  useEffect(() => {
    setupAgora();
    return () => {
      engine.current?.release();
    };
  }, []);

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

  const sendTextMessage = () => {
    if (!text.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      content: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, msg]);
    setText('');

    // Simulate astrologer reply after 2 sec
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'astrologer',
        type: 'text',
        content: 'Thank you for sharing. Based on your birth chart, I can see that... Let me analyze this carefully. 🔮',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 2000);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording & send
      setIsRecording(false);
      const duration = recordSeconds;
      const msg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        type: 'voice',
        content: 'Voice message',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration,
      };
      setMessages(prev => [...prev, msg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

      // Simulate astrologer listening & replying
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'astrologer',
          type: 'text',
          content: 'I received your voice message. Let me respond to your query... 🎙️',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }]);
      }, 3000);
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

  const endCall = () => {
    engine.current?.leaveChannel();
    clearInterval(callInterval.current);
    setInCall(false);
    const mins = Math.floor(callTimer / 60);
    const secs = callTimer % 60;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'astrologer',
      type: 'text',
      content: `Call ended. Duration: ${mins}m ${secs}s. Thank you for consulting with me! 🙏`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setCallTimer(0);
    setCallType(null);
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
          <TouchableOpacity onPress={() => setShowCallModal(true)} style={styles.callIconBtn}>
            <Ionicons name="call" size={20} color="#6c5ce7" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => initiateCall('video')} style={styles.callIconBtn}>
            <Ionicons name="videocam" size={20} color="#00cec9" />
          </TouchableOpacity>
        </View>

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

        {/* ACTIVE CALL BANNER */}
        {inCall && (
          <View style={styles.callBanner}>
            <Ionicons name={callType === 'video' ? 'videocam' : 'call'} size={20} color="#fff" />
            <Text style={styles.callBannerText}>{callType === 'video' ? 'Video' : 'Audio'} Call • {formatTime(callTimer)}</Text>
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
            {/* Remote Video (Astrologer) */}
            <View style={styles.remoteVideo}>
              {remoteUid ? (
                <RtcSurfaceView
                  canvas={{ uid: remoteUid }}
                  style={{ flex: 1 }}
                />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <Image source={{ uri: params.avatar as string }} style={styles.placeholderAvatar} />
                  <Text style={styles.placeholderText}>Waiting for {params.name}...</Text>
                </View>
              )}
            </View>

            {/* Local Video (User - Picture in Picture) */}
            <View style={styles.localVideo}>
              <RtcSurfaceView
                canvas={{ uid: 0 }}
                style={{ flex: 1 }}
              />
            </View>

            {/* Call Controls Overlay */}
            <View style={styles.videoControls}>
              <View style={styles.videoHeader}>
                <Text style={styles.videoTimer}>{formatTime(callTimer)}</Text>
                <Text style={styles.videoName}>{params.name}</Text>
              </View>

              <View style={styles.videoFooter}>
                <TouchableOpacity style={styles.videoIconBtn}>
                  <Ionicons name="mic" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={endCall} style={[styles.videoIconBtn, { backgroundColor: '#ff7675' }]}>
                  <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.videoIconBtn}>
                  <Ionicons name="camera-reverse" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
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
  messagesContent: { padding: 15, paddingBottom: 20 },
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
  videoFooter: { flexDirection: 'row', justifyContent: 'center', gap: 30 },
  videoIconBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
});
