import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, Dimensions, Switch, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/constants/translations';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { language: lang, setLanguage: changeLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [astroInfo, setAstroInfo] = useState<any>(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const savedUser = await AsyncStorage.getItem('user_data');
      const birthDetails = await AsyncStorage.getItem('birth_details');
      
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUserData(user);
        
        // Use real birth details to get Astro Card Info
        if (birthDetails) {
            const details = JSON.parse(birthDetails);
            const res = await fetch(`http://10.73.33.139:8000/api/astrology/details?day=${details.day}&month=${details.month}&year=${details.year}&hour=${details.hour}&minute=${details.minute}&second=0`);
            const json = await res.json();
            if (json.success) setAstroInfo(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!amountToAdd || isNaN(parseFloat(amountToAdd))) return;
    
    const newBalance = parseFloat(userData.wallet_balance) + parseFloat(amountToAdd);
    const updatedUser = { ...userData, wallet_balance: newBalance.toString() };
    
    setUserData(updatedUser);
    await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    
    setShowAddMoney(false);
    setAmountToAdd('');
    const successMsg = lang === 'ta' ? 'பணம் வாலட்டில் சேர்க்கப்பட்டது.' : lang === 'hi' ? 'राशि वॉलेट में जोड़ दी गई है।' : 'Amount added to wallet.';
    Alert.alert(lang === 'ta' ? 'வெற்றி!' : lang === 'hi' ? 'சफलता!' : 'Success!', successMsg);
  };

  const UI_STRINGS: any = {
    en: { title: 'Profile', wallet: 'Wallet', addMoney: 'Add Money', rasi: 'Rasi', star: 'Star', padam: 'Padam', family: 'Family Profiles', history: 'Consultation History', settings: 'Settings', logout: 'Logout', enterAmount: 'Enter Amount', confirm: 'Confirm', language: 'Language' },
    ta: { title: 'சுயவிவரம்', wallet: 'வாலட்', addMoney: 'பணம் சேர்க்க', rasi: 'ராசி', star: 'நட்சத்திரம்', padam: 'பாதம்', family: 'குடும்ப உறுப்பினர்கள்', history: 'ஆலோசனை வரலாறு', settings: 'அமைப்புகள்', logout: 'வெளியேறு', enterAmount: 'தொகையை உள்ளிடவும்', confirm: 'உறுதி செய்', language: 'மொழி' },
    hi: { title: 'प्रोफ़ाइल', wallet: 'वॉलेट', addMoney: 'पैसे जोड़ें', rasi: 'राशि', star: 'नक्षत्र', padam: 'चरण', family: 'पारिवारिक प्रोफ़ाइल', history: 'परामर्श इतिहास', settings: 'सेटिंग्स', logout: 'लॉगआउट', enterAmount: 'राशि दर्ज करें', confirm: 'पुष्टि करें', language: 'भाषा' }
  };

  const s = UI_STRINGS[lang] || UI_STRINGS['en'];

  if (loading && !userData) {
    return (
      <CosmicBackground>
        <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 100 }} />
      </CosmicBackground>
    );
  }

  return (
    <CosmicBackground>
      <View style={styles.container}>
        {/* HEADER WITH REAL WALLET BALANCE */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>{s.title}</ThemedText>
          
          <TouchableOpacity style={styles.walletBtn} onPress={() => setShowAddMoney(true)}>
            <Ionicons name="wallet" size={20} color="#00cec9" />
            <Text style={styles.walletText}>₹{parseFloat(userData?.wallet_balance || '0').toFixed(0)}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* ASTRO ID CARD WITH SELECTED AVATAR */}
          <View style={styles.astroCard}>
            <View style={styles.cardTop}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: userData?.avatar || 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }} style={styles.avatar} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userData?.name || 'User'}</Text>
                <Text style={styles.userSub}>{userData?.email}</Text>
              </View>
              <View style={styles.proBadge}><Text style={styles.proText}>VIP</Text></View>
            </View>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.astroInfoGrid}>
              <View style={styles.astroItem}><Text style={styles.astroLabel}>{s.rasi}</Text><Text style={styles.astroValue}>{userData?.rasi || astroInfo?.rasi || '...'}</Text></View>
              <View style={styles.astroItem}><Text style={styles.astroLabel}>{s.star}</Text><Text style={styles.astroValue}>{userData?.nakshatra || astroInfo?.nakshatra || '...'}</Text></View>
              <View style={styles.astroItem}><Text style={styles.astroLabel}>{s.padam}</Text><Text style={styles.astroValue}>{userData?.padam || astroInfo?.padam || '...'}</Text></View>
            </View>
          </View>

          {/* MENU LISTING */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/add-astrologer')}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(253, 203, 110, 0.1)' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#fdcb6e" />
              </View>
              <ThemedText style={styles.menuText}>Admin Panel</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/birth-details')}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(108, 92, 231, 0.2)' }]}><Ionicons name="people" size={20} color="#6c5ce7" /></View>
              <Text style={styles.menuText}>{s.family}</Text>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>

            <View style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(0, 184, 148, 0.2)' }]}><Ionicons name="language" size={20} color="#00b894" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>{s.language}</Text>
                <View style={styles.langSelector}>
                  {['en', 'ta', 'hi'].map((l) => (
                    <TouchableOpacity key={l} onPress={() => changeLanguage(l)} style={[styles.langBtn, lang === l && styles.langBtnActive]}>
                      <Text style={[styles.langText, lang === l && { color: '#fff' }]}>{l === 'en' ? 'EN' : l === 'ta' ? 'தமிழ்' : 'हिंदी'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(253, 203, 110, 0.2)' }]}><Ionicons name="notifications" size={20} color="#fdcb6e" /></View>
              <Text style={styles.menuText}>Notifications</Text>
              <Switch value={true} trackColor={{ false: "#222", true: "#6c5ce7" }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(0, 206, 201, 0.2)' }]}><Ionicons name="shield-checkmark" size={20} color="#00cec9" /></View>
              <Text style={styles.menuText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={async () => {
                await AsyncStorage.removeItem('user_data');
                router.replace('/auth/login');
            }}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(255, 118, 117, 0.1)' }]}>
                <Ionicons name="log-out" size={20} color="#ff7675" />
              </View>
              <ThemedText style={styles.menuText}>{s.logout}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#444" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ADD MONEY MODAL */}
        <Modal visible={showAddMoney} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{s.addMoney}</Text>
                <TouchableOpacity onPress={() => setShowAddMoney(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              </View>
              
              <TextInput 
                style={styles.amountInput}
                placeholder="₹ 500"
                placeholderTextColor="#444"
                keyboardType="numeric"
                value={amountToAdd}
                onChangeText={setAmountToAdd}
              />
              
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddMoney}>
                <Text style={styles.confirmText}>{s.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#6c5ce7', backgroundColor: '#131326' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userSub: { color: '#888', fontSize: 12, marginTop: 4 },
  proBadge: { backgroundColor: '#00cec9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  proText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  astroInfoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  astroItem: { alignItems: 'center' },
  astroLabel: { color: '#666', fontSize: 11, marginBottom: 4 },
  astroValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  menuSection: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 30, padding: 10, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 15 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, color: '#eee', fontSize: 16, fontWeight: '500' },
  logoutBtn: { padding: 15, alignItems: 'center', marginBottom: 20 },
  logoutText: { color: '#ff7675', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, borderWidth: 1, borderColor: '#6c5ce7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  amountInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 15, color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  confirmBtn: { backgroundColor: '#6c5ce7', padding: 18, borderRadius: 20, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  langSelector: { flexDirection: 'row', gap: 8, marginTop: 10 },
  langBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  langBtnActive: { backgroundColor: '#00b894', borderColor: '#00b894' },
  langText: { color: '#888', fontSize: 12, fontWeight: '600' }
});
