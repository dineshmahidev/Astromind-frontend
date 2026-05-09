import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const RASI_MAP: Record<string, { ta: string, en: string, icon: string, color: string }> = {
  'Mesham': { ta: 'மேஷம்', en: 'Aries', icon: '♈', color: '#FF4757' },
  'Rishabam': { ta: 'ரிஷபம்', en: 'Taurus', icon: '♉', color: '#FFA502' },
  'Mithunam': { ta: 'மிதுனம்', en: 'Gemini', icon: '♊', color: '#2ED573' },
  'Kadagam': { ta: 'கடகம்', en: 'Cancer', icon: '♋', color: '#1E90FF' },
  'Simmam': { ta: 'சிம்மம்', en: 'Leo', icon: '♌', color: '#ECCC68' },
  'Kanni': { ta: 'கன்னி', en: 'Virgo', icon: '♍', color: '#70A1FF' },
  'Thulaam': { ta: 'துலாம்', en: 'Libra', icon: '♎', color: '#FF7F50' },
  'Virutchigam': { ta: 'விருச்சிகம்', en: 'Scorpio', icon: '♏', color: '#A29BFE' },
  'Dhanusu': { ta: 'தனுசு', en: 'Sagittarius', icon: '♐', color: '#FF6B81' },
  'Magaram': { ta: 'மகரம்', en: 'Capricorn', icon: '♑', color: '#747D8C' },
  'Kumbam': { ta: 'கும்பம்', en: 'Aquarius', icon: '♒', color: '#00CEC9' },
  'Meenam': { ta: 'மீனம்', en: 'Pisces', icon: '♓', color: '#A29BFE' },
};

export default function OnboardingResult() {
  const router = useRouter();
  const { rasi, star, padam, name } = useLocalSearchParams<{ rasi: string, star: string, padam: string, name: string }>();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const gridAnims = useRef(Object.keys(RASI_MAP).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Sequence: Header fades in, then Grid items stagger
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start(() => {
        // Staggered grid animations
        const animations = gridAnims.map((anim, i) => 
            Animated.spring(anim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                delay: i * 50,
                useNativeDriver: true
            })
        );
        Animated.stagger(50, animations).start();
    });
  }, []);

  const handleStart = () => {
    router.replace('/(tabs)');
  };

  const userRasi = RASI_MAP[rasi || ''] || { ta: rasi, en: 'Zodiac', icon: '✨', color: '#6c5ce7' };

  return (
    <CosmicBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          <View style={styles.header}>
            <View style={styles.iconCircle}>
                <Text style={styles.bigIcon}>{userRasi.icon}</Text>
            </View>
            <Text style={styles.welcome}>வணக்கம், {name}!</Text>
            <Text style={styles.subtitle}>உங்களின் ராசி மற்றும் நட்சத்திர விவரங்கள் இதோ:</Text>
          </View>

          <View style={styles.mainCard}>
            <LinearGradient
                colors={['rgba(108, 92, 231, 0.2)', 'rgba(0,0,0,0)']}
                style={styles.cardGradient}
            />
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>ராசி (RASI)</Text>
                    <Text style={styles.statValueTa}>{userRasi.ta}</Text>
                    <Text style={styles.statValueEn}>{userRasi.en}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>நட்சத்திரம் (STAR)</Text>
                    <Text style={styles.statValueTa}>{star}</Text>
                    <Text style={styles.statValueEn}>Padam {padam}</Text>
                </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>12 ராசிகள் (The 12 Signs)</Text>
          <View style={styles.rasiGrid}>
            {Object.entries(RASI_MAP).map(([key, value], index) => {
              const isUserRasi = key === rasi;
              return (
                <Animated.View 
                    key={key} 
                    style={[
                        styles.rasiItem, 
                        isUserRasi && { borderColor: value.color, backgroundColor: `${value.color}20` },
                        {
                            opacity: gridAnims[index],
                            transform: [{ scale: gridAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
                        }
                    ]}
                >
                  <Text style={[styles.rasiIcon, { color: value.color }]}>{value.icon}</Text>
                  <Text style={styles.rasiNameTa}>{value.ta}</Text>
                  <Text style={styles.rasiNameEn}>{value.en}</Text>
                  {isUserRasi && (
                    <View style={[styles.activeBadge, { backgroundColor: value.color }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <LinearGradient
                colors={['#6c5ce7', '#a29bfe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
            >
                <Text style={styles.startText}>பயணத்தைத் தொடங்கு</Text>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </CosmicBackground>
  );
}


const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingVertical: 60 },
  container: { flex: 1, paddingHorizontal: 25, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bigIcon: { fontSize: 50 },
  welcome: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  mainCard: { width: '100%', borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 40 },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  statsRow: { flexDirection: 'row', padding: 25, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  statLabel: { color: '#6c5ce7', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  statValueTa: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statValueEn: { color: '#888', fontSize: 14, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 20, marginLeft: 5 },
  rasiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 40 },
  rasiItem: { width: (width - 74) / 3, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', position: 'relative' },
  activeBadge: { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rasiIcon: { fontSize: 24, marginBottom: 8 },
  rasiNameTa: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  rasiNameEn: { color: '#666', fontSize: 10, marginTop: 2 },
  startBtn: { width: '100%', height: 60, borderRadius: 20, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

