import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG, ONE_ON_ONE_AUDIO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function LiveCallScreen() {
    const { consultationId, mode, name, userId: targetUserId } = useLocalSearchParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [zegoConfig, setZegoConfig] = useState<any>(null);
    const [remoteUserJoined, setRemoteUserJoined] = useState(false);
    const [duration, setDuration] = useState(0);
    const zegoRef = React.useRef<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        let timer: any;
        if (remoteUserJoined) {
            timer = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(timer);
    }, [remoteUserJoined]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const loadData = async () => {
        try {
            const ud = await AsyncStorage.getItem('user_data');
            if (ud) {
                setUser(JSON.parse(ud));
            } else {
                Alert.alert('Error', 'User session not found');
                router.back();
                return;
            }

            // Fetch Zego Config from Backend
            const res = await fetch('http://10.22.133.139:8000/api/settings/zego');
            
            // Check if response is JSON
            const contentType = res.headers.get("content-type");
            if (!res.ok || !contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error('Non-JSON response received:', text.substring(0, 200));
                throw new Error('Backend returned an invalid response (not JSON). Please check your backend routes and PHP syntax.');
            }

            const json = await res.json();
            if (json.success && json.app_id && json.app_sign) {
                setZegoConfig({
                    appID: Number(json.app_id),
                    appSign: json.app_sign
                });
            } else {
                console.error('Invalid Zego config data:', json);
                Alert.alert('Configuration Error', 'ZegoCloud keys (ZEGO_APP_ID/ZEGO_APP_SIGN) are missing in the backend .env file.');
            }
        } catch (e: any) {
            console.error('Call initialization error:', e);
            Alert.alert('Call Error', e.message || 'Failed to initialize call. Check your internet connection and backend status.');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !user || !zegoConfig) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6c5ce7" />
            </View>
        );
    }

    // Prepare Zego Parameters
    const callID = `call_${consultationId}`;
    const userID = String(user.id);
    const userName = user.name || `User_${user.id}`;
    const isVideo = mode === 'video';

    const onHangUp = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <ZegoUIKitPrebuiltCall
                ref={zegoRef}
                appID={zegoConfig.appID}
                appSign={zegoConfig.appSign}
                userID={userID}
                userName={userName}
                callID={callID}
                config={{
                    ...(isVideo ? ONE_ON_ONE_VIDEO_CALL_CONFIG : ONE_ON_ONE_AUDIO_CALL_CONFIG),
                    onHangUp: onHangUp,
                    onCallEnd: (callID, reason, duration) => {
                        onHangUp();
                    },
                    onUserJoin: (user) => {
                        if (user.userID !== userID) {
                            setRemoteUserJoined(true);
                        }
                    },
                    onUserLeave: (user) => {
                        if (user.userID !== userID) {
                            setRemoteUserJoined(false);
                        }
                    },
                    durationConfig: {
                        isVisible: false, // Hide default Zego timer
                    },
                }}
            />
            
            {remoteUserJoined && (
                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>{formatDuration(duration)}</Text>
                </View>
            )}

            {!remoteUserJoined && (
                <View style={styles.waitingOverlay} pointerEvents="none">
                    <Text style={styles.waitingText}>Waiting for Astrologer...</Text>
                </View>
            )}

            {/* Custom Back Button - only show if remote user hasn't joined or for emergency exit */}
            <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => {
                    // Try to hang up via ref if possible, then go back
                    if (zegoRef.current?.hangUp) {
                        zegoRef.current.hangUp();
                    } else {
                        router.back();
                    }
                }}
            >
                <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#050510',
    },
    waitingOverlay: {
        position: 'absolute',
        top: '40%',
        width: '100%',
        alignItems: 'center',
        zIndex: 5,
    },
    waitingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 15,
        borderRadius: 20,
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 999,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerContainer: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
        zIndex: 1000,
    },
    timerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
