import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingResult() {
  const router = useRouter();
  const { rasi, star, padam, name } = useLocalSearchParams();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true })
    ]).start();
  }, []);

  const handleStart = () => {
    router.replace('/(tabs)');
  };

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <Animated.View 
            style={[
                styles.resultCard, 
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={40} color="#fdcb6e" />
          </View>
          
          <Text style={styles.welcome}>Welcome, {name}!</Text>
          <Text style={styles.subtitle}>Your celestial identity has been revealed:</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>RASI</Text>
                <Text style={styles.statValue}>{rasi}</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>NAKSHATRA</Text>
                <Text style={styles.statValue}>{star}</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>PADAM</Text>
                <Text style={styles.statValue}>{padam}</Text>
            </View>
          </View>

          <Text style={styles.blurb}>
            The stars were aligned in this unique pattern at the moment of your birth. 
            Astromind will now guide you through your cosmic journey.
          </Text>

          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startText}>Enter My Universe</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
  resultCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 40, padding: 30, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(253, 203, 110, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  welcome: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 40 },
  statsGrid: { width: '100%', gap: 20, marginBottom: 40 },
  statItem: { backgroundColor: 'rgba(108, 92, 231, 0.1)', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(108, 92, 231, 0.2)' },
  statLabel: { color: '#6c5ce7', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  blurb: { color: '#666', textAlign: 'center', lineHeight: 22, fontSize: 13, marginBottom: 40 },
  startBtn: { backgroundColor: '#6c5ce7', paddingHorizontal: 30, paddingVertical: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  startText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
