import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ZegoUIKitPrebuiltCall, { ONE_ON_ONE_VIDEO_CALL_CONFIG, ONE_ON_ONE_AUDIO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function LiveCallScreen() {
    const { consultationId, mode, name, userId: targetUserId } = useLocalSearchParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [zegoConfig, setZegoConfig] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

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

    return (
        <View style={styles.container}>
            <ZegoUIKitPrebuiltCall
                appID={zegoConfig.appID}
                appSign={zegoConfig.appSign}
                userID={userID}
                userName={userName}
                callID={callID}
                config={{
                    ...(isVideo ? ONE_ON_ONE_VIDEO_CALL_CONFIG : ONE_ON_ONE_AUDIO_CALL_CONFIG),
                    onHangUp: () => {
                        router.back();
                    },
                    onOnlySelfInRoom: () => {
                        // Optional: logic when other person leaves
                    },
                }}
            />
            
            {/* Custom Back Button overlay in case UI doesn't have it clearly */}
            <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => router.back()}
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
    }
});
