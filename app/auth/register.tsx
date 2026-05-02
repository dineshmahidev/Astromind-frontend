import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert, ScrollView, Dimensions, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FUNKY_AVATARS = [
  { id: 'av1', url: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' },
  { id: 'av2', url: 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png' },
  { id: 'av3', url: 'https://cdn-icons-png.flaticon.com/512/4140/4140051.png' },
  { id: 'av4', url: 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png' },
  { id: 'av5', url: 'https://cdn-icons-png.flaticon.com/512/4140/4140040.png' },
  { id: 'av6', url: 'https://cdn-icons-png.flaticon.com/512/4140/4140061.png' },
  { id: 'av7', url: 'https://cdn-icons-png.flaticon.com/512/4140/4140043.png' },
  { id: 'av8', url: 'https://cdn-icons-png.flaticon.com/512/4140/4140052.png' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en');
  const [showPicker, setShowPicker] = useState<'date' | 'time' | 'avatar' | null>(null);
  const [timeStep, setTimeStep] = useState<'hour' | 'minute'>('hour');
  // Auto-assign a random funky avatar on screen load
  const [selectedAvatar, setSelectedAvatar] = useState(
    FUNKY_AVATARS[Math.floor(Math.random() * FUNKY_AVATARS.length)]
  );

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    day: 1, month: 1, year: 1995,
    hour: 12, minute: 0,
    period: 'AM'
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 100 }, (_, i) => 2024 - i);
  const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const allMinutes = Array.from({ length: 60 }, (_, i) => i);

  useEffect(() => {
    checkLang();
  }, []);

  const checkLang = async () => {
    const savedLang = await AsyncStorage.getItem('app_lang') || 'en';
    setLang(savedLang);
  };

  const toggleLanguage = async () => {
    const newLang = lang === 'en' ? 'ta' : 'en';
    setLang(newLang);
    await AsyncStorage.setItem('app_lang', newLang);
  };

  const handleRegister = async () => {
    const { name, email, password, day, month, year, hour, minute, period } = form;
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill all fields');

    setLoading(true);
    try {
      let hour24 = hour;
      if (period === 'PM' && hour !== 12) hour24 += 12;
      if (period === 'AM' && hour === 12) hour24 = 0;

      const dob = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const tob = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      const response = await fetch('http://10.73.33.139:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, dob, tob, avatar: selectedAvatar.url }),
      });
      const json = await response.json();
      
      if (json.success) {
        await AsyncStorage.setItem('user_token', 'true');
        await AsyncStorage.setItem('user_data', JSON.stringify(json.user));
        await AsyncStorage.setItem('birth_details', JSON.stringify({
            name, day, month, year, hour: hour24, minute
        }));
        router.push({
            pathname: '/auth/onboarding',
            params: { rasi: json.user.rasi, star: json.user.nakshatra, padam: json.user.padam, name: json.user.name }
        });
      } else {
        Alert.alert('Registration Failed', json.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const UI: any = {
    en: { title: 'Create Account', sub: 'Precision astrology for your soul', name: 'Full Name', email: 'Email', pass: 'Password', birth: 'Accurate Birth Details', btn: 'Reveal My Universe', login: 'Already have an account? Login' },
    ta: { title: 'கணக்கை உருவாக்கு', sub: 'உங்கள் ஆன்மாவிற்கான துல்லியமான ஜோதிடம்', name: 'முழு பெயர்', email: 'மின்னஞ்சல்', pass: 'கடவுச்சொல்', birth: 'பிறந்த விவரங்கள்', btn: 'என் உலகைக் காட்டு', login: 'ஏற்கனவே கணக்கு உள்ளதா? லாகின்' }
  };
  const t = UI[lang];

  return (
    <CosmicBackground>
      <View style={{ flex: 1 }}>
        {/* LANG TOGGLE */}
        <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
            <Ionicons name="language" size={16} color="#fff" />
            <Text style={styles.langText}>{lang === 'en' ? 'தமிழ்' : 'English'}</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.topSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowPicker('avatar')}>
                <Image source={{ uri: selectedAvatar.url }} style={styles.mainAvatar} />
                <View style={styles.editBadge}><Ionicons name="pencil" size={12} color="#fff" /></View>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.appName}>{t.title}</ThemedText>
            <Text style={styles.tagline}>{t.sub}</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.form}>
              <View style={styles.inputBox}><Ionicons name="person-outline" size={18} color="#6c5ce7" /><TextInput style={styles.input} placeholder={t.name} placeholderTextColor="#ffffff" value={form.name} onChangeText={(v) => setForm({...form, name: v})} /></View>
              <View style={styles.inputBox}><Ionicons name="mail-outline" size={18} color="#6c5ce7" /><TextInput style={styles.input} placeholder={t.email} placeholderTextColor="#ffffff" value={form.email} onChangeText={(v) => setForm({...form, email: v})} /></View>
              <View style={styles.inputBox}><Ionicons name="lock-closed-outline" size={18} color="#6c5ce7" /><TextInput style={styles.input} placeholder={t.pass} placeholderTextColor="#ffffff" secureTextEntry value={form.password} onChangeText={(v) => setForm({...form, password: v})} /></View>

              <Text style={styles.sectionTitle}>{t.birth}</Text>
              
              <View style={styles.pickerRowStatic}>
                <TouchableOpacity style={[styles.pickerTrigger, { flex: 1.2 }]} onPress={() => setShowPicker('date')}>
                    <Ionicons name="calendar" size={18} color="#6c5ce7" />
                    <Text style={styles.pickerValue}>{form.day} {months[form.month-1].substring(0,3)} {form.year}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.pickerTrigger, { flex: 0.8 }]} onPress={() => { setShowPicker('time'); setTimeStep('hour'); }}>
                    <Ionicons name="time" size={18} color="#00cec9" />
                    <Text style={styles.pickerValue}>{form.hour}:{form.minute.toString().padStart(2, '0')} {form.period}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.regBtn} onPress={handleRegister}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.regText}>{t.btn}</Text>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>{t.login}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* AVATAR PICKER MODAL */}
        <Modal visible={showPicker === 'avatar'} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Choose Your Avatar</Text>
                <TouchableOpacity onPress={() => setShowPicker(null)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              </View>
              <View style={styles.avatarGrid}>
                {FUNKY_AVATARS.map(av => (
                  <TouchableOpacity key={av.id} onPress={() => { setSelectedAvatar(av); setShowPicker(null); }} style={[styles.avatarOption, selectedAvatar.id === av.id && styles.avatarSelected]}>
                    <Image source={{ uri: av.url }} style={styles.avatarImg} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* DATE & TIME PICKER (Simplified from previous implementation) */}
        <Modal visible={showPicker === 'date' || showPicker === 'time'} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.pickerCard, { height: 'auto' }]}>
                   <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>Select {showPicker}</Text>
                   <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                       {showPicker === 'date' ? (
                           <>
                           <TextInput style={styles.pInput} value={form.day.toString()} onChangeText={(v) => setForm({...form, day: parseInt(v) || 1})} keyboardType="numeric" maxLength={2} />
                           <TextInput style={styles.pInput} value={form.month.toString()} onChangeText={(v) => setForm({...form, month: parseInt(v) || 1})} keyboardType="numeric" maxLength={2} />
                           <TextInput style={[styles.pInput, { width: 80 }]} value={form.year.toString()} onChangeText={(v) => setForm({...form, year: parseInt(v) || 1995})} keyboardType="numeric" maxLength={4} />
                           </>
                       ) : (
                           <>
                           <TextInput style={styles.pInput} value={form.hour.toString()} onChangeText={(v) => setForm({...form, hour: parseInt(v) || 12})} keyboardType="numeric" maxLength={2} />
                           <Text style={{ color: '#fff', fontSize: 24 }}>:</Text>
                           <TextInput style={styles.pInput} value={form.minute.toString()} onChangeText={(v) => setForm({...form, minute: parseInt(v) || 0})} keyboardType="numeric" maxLength={2} />
                           <TouchableOpacity onPress={() => setForm({...form, period: form.period === 'AM' ? 'PM' : 'AM'})} style={styles.mBtnActive}><Text style={{ color: '#fff' }}>{form.period}</Text></TouchableOpacity>
                           </>
                       )}
                   </View>
                   <TouchableOpacity style={styles.doneBtn} onPress={() => setShowPicker(null)}><Text style={styles.doneText}>Set</Text></TouchableOpacity>
                </View>
            </View>
        </Modal>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  langToggle: { position: 'absolute', top: 50, right: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(108, 92, 231, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, gap: 5 },
  langText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  topSection: { alignItems: 'center', marginTop: 80, marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  mainAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#6c5ce7', backgroundColor: 'rgba(255,255,255,0.05)' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#6c5ce7', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0a0a1a' },
  appName: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  tagline: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 5 },
  formSection: { paddingHorizontal: 25 },
  form: { gap: 12 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 14 },
  sectionTitle: { color: '#6c5ce7', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 10 },
  pickerRowStatic: { flexDirection: 'row', gap: 10 },
  pickerTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 8 },
  pickerValue: { color: '#fff', fontSize: 13, fontWeight: '500' },
  regBtn: { backgroundColor: '#6c5ce7', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, flexDirection: 'row', gap: 10 },
  regText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginLink: { marginTop: 10, padding: 10, alignItems: 'center' },
  loginLinkText: { color: '#888', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  pickerCard: { backgroundColor: '#0a0a1a', borderRadius: 30, padding: 25, width: '90%', borderWidth: 1, borderColor: '#6c5ce7' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
  avatarOption: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'transparent', padding: 5 },
  avatarSelected: { borderColor: '#6c5ce7', backgroundColor: 'rgba(108, 92, 231, 0.1)' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 30 },
  pInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 18, textAlign: 'center', width: 50 },
  mBtnActive: { backgroundColor: '#00cec9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  doneBtn: { backgroundColor: '#6c5ce7', padding: 15, borderRadius: 15, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: 'bold' }
});
