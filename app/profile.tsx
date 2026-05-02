import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, Dimensions, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [lang, setLang] = useState('en');
  const [birthData, setBirthData] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(1250); // Dummy balance

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedLang = await AsyncStorage.getItem('app_lang') || 'en';
    const savedBirth = await AsyncStorage.getItem('birth_details');
    setLang(savedLang);
    if (savedBirth) setBirthData(JSON.parse(savedBirth));
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back(); else router.replace('/');
  };

  const UI_STRINGS: any = {
    en: { title: 'Profile', wallet: 'Wallet', addMoney: 'Add Money', astroId: 'Astro Identity', family: 'Family Profiles', history: 'Consultation History', settings: 'Settings', logout: 'Logout' },
    ta: { title: 'சுயவிவரம்', wallet: 'வாலட்', addMoney: 'பணம் சேர்க்க', astroId: 'ஜோதிட அடையாளம்', family: 'குடும்ப உறுப்பினர்கள்', history: 'ஆலோசனை வரலாறு', settings: 'அமைப்புகள்', logout: 'வெளியேறு' }
  };

  const s = UI_STRINGS[lang] || UI_STRINGS['en'];

  return (
    <CosmicBackground>
      <View style={styles.container}>
        {/* HEADER WITH WALLET */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{s.title}</ThemedText>
          
          <TouchableOpacity style={styles.walletBtn} onPress={() => {}}>
            <Ionicons name="wallet" size={20} color="#00cec9" />
            <Text style={styles.walletText}>₹{walletBalance}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* ASTRO ID CARD */}
          <View style={styles.astroCard}>
            <View style={styles.cardTop}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.avatar} />
                <View style={styles.editIcon}><Ionicons name="camera" size={12} color="#fff" /></View>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{birthData?.name || 'User'}</Text>
                <Text style={styles.userSub}>{birthData?.day}/{birthData?.month}/{birthData?.year} • {birthData?.hour}:{birthData?.minute}</Text>
              </View>
              <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>
            </View>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.astroInfoGrid}>
              <View style={styles.astroItem}><Text style={styles.astroLabel}>Rasi</Text><Text style={styles.astroValue}>Kanni</Text></View>
              <View style={styles.astroItem}><Text style={styles.astroLabel}>Nakshatra</Text><Text style={styles.astroValue}>Hastham</Text></View>
              <View style={styles.astroItem}><Text style={styles.astroLabel}>Lagna</Text><Text style={styles.astroValue}>Mesham</Text></View>
            </View>
          </View>

          {/* WALLET ACTIONS */}
          <TouchableOpacity style={styles.addMoneyBanner} onPress={() => {}}>
            <View style={styles.addMoneyInfo}>
              <Text style={styles.addMoneyTitle}>{s.addMoney}</Text>
              <Text style={styles.addMoneySub}>Get 20% Extra on first recharge!</Text>
            </View>
            <Ionicons name="add-circle" size={32} color="#fff" />
          </TouchableOpacity>

          {/* MENU LISTING */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(108, 92, 231, 0.2)' }]}><Ionicons name="people" size={20} color="#6c5ce7" /></View>
              <Text style={styles.menuText}>{s.family}</Text>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(0, 206, 201, 0.2)' }]}><Ionicons name="time" size={20} color="#00cec9" /></View>
              <Text style={styles.menuText}>{s.history}</Text>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(253, 203, 110, 0.2)' }]}><Ionicons name="settings" size={20} color="#fdcb6e" /></View>
              <Text style={styles.menuText}>{s.settings}</Text>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>

            <View style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(232, 67, 147, 0.2)' }]}><Ionicons name="notifications" size={20} color="#e84393" /></View>
              <Text style={styles.menuText}>Notifications</Text>
              <Switch value={true} trackColor={{ false: "#222", true: "#6c5ce7" }} />
            </View>
          </View>

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/birth-details')}>
            <Text style={styles.logoutText}>{s.logout}</Text>
          </TouchableOpacity>
          
          <Text style={styles.versionText}>Astromind Elite v1.0.4</Text>
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  walletBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: 'rgba(0, 206, 201, 0.3)' },
  walletText: { color: '#00cec9', fontWeight: 'bold', fontSize: 16 },
  astroCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 25 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 2, borderColor: '#6c5ce7' },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6c5ce7', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1a1a2e' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userSub: { color: '#888', fontSize: 12, marginTop: 4 },
  proBadge: { backgroundColor: '#fdcb6e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  proText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  astroInfoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  astroItem: { alignItems: 'center' },
  astroLabel: { color: '#666', fontSize: 11, marginBottom: 4 },
  astroValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  addMoneyBanner: { backgroundColor: '#6c5ce7', borderRadius: 25, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, shadowColor: '#6c5ce7', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  addMoneyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addMoneySub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  menuSection: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 30, padding: 10, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 15 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, color: '#eee', fontSize: 16, fontWeight: '500' },
  logoutBtn: { padding: 15, alignItems: 'center', marginBottom: 20 },
  logoutText: { color: '#ff7675', fontWeight: 'bold', fontSize: 16 },
  versionText: { color: '#444', textAlign: 'center', fontSize: 10 },
});
