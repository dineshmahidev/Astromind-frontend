import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Dimensions, Image, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [userData, setUserData] = React.useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const AVATARS = [
      'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
      'https://cdn-icons-png.flaticon.com/512/4140/4140047.png',
      'https://cdn-icons-png.flaticon.com/512/4140/4140051.png',
      'https://cdn-icons-png.flaticon.com/512/4140/4140037.png',
      'https://cdn-icons-png.flaticon.com/512/4140/4140040.png',
      'https://cdn-icons-png.flaticon.com/512/4140/4140061.png',
      'https://cdn-icons-png.flaticon.com/512/4140/4140043.png',
      'https://cdn-icons-png.flaticon.com/512/4140/4140052.png',
    ];

    try {
      const profileData = await AsyncStorage.getItem('user_data');
      const astroData = await AsyncStorage.getItem('user_astrology');
      
      let combined = {};
      if (profileData) {
        const user = JSON.parse(profileData);
        // If no avatar, assign deterministically based on name (always same for same user)
        if (!user.avatar && user.name) {
          const idx = user.name.charCodeAt(0) % AVATARS.length;
          user.avatar = AVATARS[idx];
          await AsyncStorage.setItem('user_data', JSON.stringify(user));
        }
        combined = { ...user };
      }
      
      if (astroData) {
        const astrology = JSON.parse(astroData);
        combined = { ...combined, ...astrology };
      }
      
      setUserData(combined);
    } catch (e) {
      console.error('Error loading home data:', e);
    }
  };

  return (
    <CosmicBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t.good_evening} 🌙</Text>
            <Text style={styles.appName}>{userData?.name || t.welcome}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
            {userData?.avatar
              ? <Image source={{ uri: userData.avatar }} style={styles.avatarImg} />
              : <View style={styles.avatarPlaceholder}><Ionicons name="person" size={22} color="#6c5ce7" /></View>
            }
            <View style={styles.avatarOnline} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.moonOrbit}>
              <Ionicons name="moon" size={50} color="#f1c40f" style={styles.moonIcon} />
            </View>
            <View>
              <ThemedText style={styles.cardTitle}>{userData ? t.birth_details : 'Current Moon Sign'}</ThemedText>
              <ThemedText style={styles.cardHighlight}>
                {userData ? userData.rasi : 'Unknown'}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.cardBody}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.nakshatra || 'Nakshatra'}</Text>
                <Text style={styles.detailValue}>{userData?.nakshatra || '—'}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.padam || 'Padam'}</Text>
                <Text style={styles.detailValue}>{userData?.padam || '—'}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.setupButton}
              onPress={() => router.push('/birth-details')}
            >
              <ThemedText style={styles.buttonText}>
                {userData ? t.update_details : t.set_birth_details}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.grid}>
          <Animated.View entering={FadeInUp.delay(600)}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/horoscope')}>
              <Ionicons name="star" size={30} color="#6c5ce7" />
              <ThemedText style={styles.gridText}>{t.horoscope}</ThemedText>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(700)}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/matching')}>
              <Ionicons name="heart" size={30} color="#e84393" />
              <ThemedText style={styles.gridText}>{t.matching}</ThemedText>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(900)}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/kundli')}>
              <Ionicons name="book" size={30} color="#fab1a0" />
              <ThemedText style={styles.gridText}>{t.kundli}</ThemedText>
            </TouchableOpacity>
          </Animated.View>

          {/* Marriage Report Banner */}
          <Animated.View entering={FadeInUp.delay(950)}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/marriage')}>
              <Ionicons name="heart-circle" size={30} color="#e84393" />
              <ThemedText style={styles.gridText}>{t.marriage}</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Full-Width Marriage Report Banner */}
        <Animated.View entering={FadeInUp.delay(1000)}>
          <TouchableOpacity style={styles.marriageBanner} onPress={() => router.push('/marriage')}>
            <View style={styles.marriageBannerLeft}>
              <Text style={styles.marriageBannerTitle}>💍 {t.marriage_report}</Text>
              <Text style={styles.marriageBannerSub}>When will you get married? Love or Arranged?</Text>
            </View>
            <View style={styles.marriageBannerBtn}>
              <Text style={styles.marriageBannerBtnText}>{t.view}</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Section Title */}
        <Animated.View entering={FadeInUp.delay(1020)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.future_predict}</Text>
          <TouchableOpacity onPress={() => router.push('/future-predict')}>
            <Text style={styles.seeAllText}>{t.view}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Horizontal Future Prediction Container */}
        <Animated.View entering={FadeInUp.delay(1050)} style={styles.futureListWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.futureContainer}
          >
            <TouchableOpacity 
              style={[styles.futureItem, { backgroundColor: '#6c5ce7' }]}
              onPress={() => router.push({ pathname: '/future-predict', params: { cat: 'career' } })}
            >
              <Ionicons name="briefcase" size={24} color="#fff" />
              <Text style={styles.futureItemText}>{t.career}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.futureItem, { backgroundColor: '#e84393' }]}
              onPress={() => router.push({ pathname: '/future-predict', params: { cat: 'wealth' } })}
            >
              <Ionicons name="cash" size={24} color="#fff" />
              <Text style={styles.futureItemText}>{t.wealth}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.futureItem, { backgroundColor: '#00cec9' }]}
              onPress={() => router.push({ pathname: '/future-predict', params: { cat: 'health' } })}
            >
              <Ionicons name="medkit" size={24} color="#fff" />
              <Text style={styles.futureItemText}>{t.health}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.futureItem, { backgroundColor: '#fab1a0' }]}
              onPress={() => router.push({ pathname: '/future-predict', params: { cat: 'family' } })}
            >
              <Ionicons name="people" size={24} color="#fff" />
              <Text style={styles.futureItemText}>{t.family}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.futureItem, { backgroundColor: '#fdcb6e' }]}
              onPress={() => router.push({ pathname: '/future-predict', params: { cat: 'education' } })}
            >
              <Ionicons name="book" size={24} color="#fff" />
              <Text style={styles.futureItemText}>{t.education}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Consult Astrologer CTA */}
        <Animated.View entering={FadeInUp.delay(1100)}>
          <TouchableOpacity style={styles.consultBanner} onPress={() => router.push('/(tabs)/astrologers')}>
            <Ionicons name="chatbubbles" size={22} color="#00cec9" />
            <View style={{ flex: 1 }}>
              <Text style={styles.consultTitle}>{t.talk_astrologer}</Text>
              <Text style={styles.consultSub}>{t.get_predictions}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#00cec9" />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 110, // Space for floating tab bar
  },
  header: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  appName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  avatarBtn: {
    position: 'relative',
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#6c5ce7',
    backgroundColor: '#131326',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    borderWidth: 2,
    borderColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6c5ce7',
    borderWidth: 2,
    borderColor: '#070714',
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 35,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 30,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  moonOrbit: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(241, 196, 15, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(241, 196, 15, 0.2)',
  },
  moonIcon: {
    textShadowColor: 'rgba(241, 196, 15, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  cardTitle: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cardHighlight: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardBody: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    color: '#666',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  setupButton: {
    backgroundColor: '#6c5ce7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  gridItem: {
    width: (width - 55) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gridText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '600',
  },
  futureListWrapper: {
    marginHorizontal: -20,
  },
  futureContainer: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 20,
  },
  futureItem: {
    width: 120,
    height: 120,
    borderRadius: 24,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  futureItemText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  marriageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(232, 67, 147, 0.12)',
    borderRadius: 20,
    padding: 18,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(232, 67, 147, 0.3)',
  },
  marriageBannerLeft: { flex: 1 },
  marriageBannerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  marriageBannerSub: { color: '#aaa', fontSize: 12, marginTop: 4 },
  marriageBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e84393',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  marriageBannerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  consultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(0, 206, 201, 0.08)',
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 201, 0.2)',
  },
  consultTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  consultSub: { color: '#888', fontSize: 12, marginTop: 3 },
});
