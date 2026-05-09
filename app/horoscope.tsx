import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Text, Dimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/constants/Config';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
];

const UI_STRINGS: Record<string, any> = {
  en: { title: 'Daily Horoscope', luck: 'Luck-o-meter', timings: 'Auspicious Timings', panch: 'Panchangam', guidance: 'Daily Guidance', remedies: 'Remedies', sani: 'Sani Report', career: 'Career', wealth: 'Wealth', love: 'Love', health: 'Health', rahu: 'Rahu Kaalam', yama: 'Yamagandam', gulika: 'Gulikai', mantra: 'Mantra', color: 'Lucky Color', number: 'Lucky Number', selectLang: 'Language' },
  ta: { title: 'தினசரி பலன்கள்', luck: 'அதிர்ஷ்ட மீட்டர்', timings: 'முக்கிய நேரங்கள்', panch: 'பஞ்சாங்கம்', guidance: 'தினசரி வழிகாட்டுதல்', remedies: 'பரிகாரங்கள்', sani: 'சனி பெயர்ச்சி', career: 'தொழில்', wealth: 'செல்வம்', love: 'அன்பு', health: 'ஆரோக்கியம்', rahu: 'ராகு காலம்', yama: 'எமகண்டம்', gulika: 'குளிகை', mantra: 'மந்திரம்', color: 'அதிர்ஷ்ட நிறம்', number: 'அதிர்ஷ்ட எண்', selectLang: 'மொழி' },
  hi: { title: 'दैनिक राशिफल', luck: 'भाग्य मीटर', timings: 'शुभ समय', panch: 'पंचांग', guidance: 'दैनिक मार्गदर्शन', remedies: 'उपाय', sani: 'शनि रिपोर्ट', career: 'करियर', wealth: 'धन', love: 'प्रेम', health: 'स्वास्थ्य', rahu: 'राहु काल', yama: 'यमगंडम', gulika: 'गुलिका', mantra: 'मंत्र', color: 'शुभ रंग', number: 'शुभ अंक', selectLang: 'भाषा' }
};

export default function HoroscopeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [horoscope, setHoroscope] = useState<any>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    fetchHoroscope(lang, period);
  }, [lang, period]);

  const loadInitial = async () => {
    const saved = await AsyncStorage.getItem('app_lang');
    if (saved) setLang(saved);
  };

  const fetchHoroscope = async (targetLang: string, targetPeriod: string) => {
    setLoading(true);
    try {
      const birthDetails = await AsyncStorage.getItem('birth_details');
      if (!birthDetails) {
        setLoading(false);
        return;
      }
      const details = JSON.parse(birthDetails);
      const res = await fetch(`${BASE_URL}/astrology/details?day=${details.day}&month=${details.month}&year=${details.year}&hour=${details.hour}&minute=${details.minute}&second=0`);
      const detailsJson = await res.json();
      
      if (detailsJson.success) {
        const rasiIdx = detailsJson.data.rasi_idx;
        const hRes = await fetch(`${BASE_URL}/astrology/horoscope?sign_idx=${rasiIdx}&period=${targetPeriod}&lang=${targetLang}`);
        const hJson = await hRes.json();
        if (hJson.success) setHoroscope(hJson.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (code: string) => {
    setLang(code);
    await AsyncStorage.setItem('app_lang', code);
    setShowLangPicker(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back(); else router.replace('/');
  };

  const s = UI_STRINGS[lang];
  const currentLang = LANGUAGES.find(l => l.code === lang);

  const ProgressBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{s.title}</ThemedText>
          <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangPicker(true)}>
            <Text style={styles.langBtnText}>{currentLang?.flag}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.periodTabs}>
          {['daily', 'weekly', 'monthly'].map((p: any) => (
            <TouchableOpacity key={p} style={[styles.periodTab, period === p && styles.activePeriodTab]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodTabText, period === p && styles.activePeriodTabText]}>{p.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 100 }} />
        ) : horoscope ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* LUCK METER */}
            {horoscope.luck_metrics && (
              <View style={styles.premiumCard}>
                <Text style={styles.cardHeader}>📊 {s.luck}</Text>
                <ProgressBar label={s.career} value={horoscope.luck_metrics.career} color="#6c5ce7" />
                <ProgressBar label={s.wealth} value={horoscope.luck_metrics.wealth} color="#00cec9" />
                <ProgressBar label={s.love} value={horoscope.luck_metrics.love} color="#e84393" />
                <ProgressBar label={s.health} value={horoscope.luck_metrics.health} color="#fdcb6e" />
              </View>
            )}

            {/* PREDICTION */}
            <View style={styles.premiumCard}>
              <Text style={styles.cardHeader}>🔮 {horoscope.sign}</Text>
              <Text style={styles.predictionText}>{horoscope.prediction}</Text>
              <View style={styles.divider} />
              <Text style={styles.transitText}>✨ {horoscope.transit_analysis}</Text>
            </View>

            {/* TIMINGS */}
            {horoscope.timings && (
              <View style={styles.premiumCard}>
                <Text style={styles.cardHeader}>⏰ {s.timings}</Text>
                <View style={styles.timingRow}>
                  <View style={styles.timingBox}><Text style={styles.timingLabel}>{s.rahu}</Text><Text style={styles.timingValue}>{horoscope.timings.rahu}</Text></View>
                  <View style={styles.timingBox}><Text style={styles.timingLabel}>{s.yama}</Text><Text style={styles.timingValue}>{horoscope.timings.yama}</Text></View>
                </View>
                <View style={styles.timingBoxFull}><Text style={styles.timingLabel}>{s.gulika}</Text><Text style={styles.timingValue}>{horoscope.timings.gulika}</Text></View>
              </View>
            )}

            {/* REMEDIES */}
            <View style={styles.premiumCard}>
              <Text style={styles.cardHeader}>🕉️ {s.remedies}</Text>
              <View style={styles.remedyGrid}>
                <View style={styles.remedyItem}><Text style={styles.remedyLabel}>{s.color}</Text><Text style={styles.remedyValue}>{horoscope.remedies.color}</Text></View>
                <View style={styles.remedyItem}><Text style={styles.remedyLabel}>{s.number}</Text><Text style={styles.remedyValue}>{horoscope.remedies.number}</Text></View>
              </View>
              <Text style={styles.mantraLabel}>{s.mantra}</Text>
              <Text style={styles.mantraValue}>"{horoscope.remedies.mantra}"</Text>
              <View style={styles.ritualBox}><Text style={styles.ritualText}>🕯️ {horoscope.remedies.ritual}</Text></View>
            </View>

            {/* PANCHANGAM & SANI */}
            <View style={styles.horizontalScroll}>
              <View style={styles.smallCard}>
                <Text style={styles.smallCardHeader}>📜 {s.panch}</Text>
                <Text style={styles.smallCardText}>{horoscope.panchangam.tithi} | {horoscope.panchangam.nakshatra}</Text>
              </View>
              <View style={[styles.smallCard, { backgroundColor: 'rgba(255, 118, 117, 0.1)' }]}>
                <Text style={[styles.smallCardHeader, { color: '#ff7675' }]}>🪐 {s.sani}</Text>
                <Text style={styles.smallCardText}>{horoscope.sani_report}</Text>
              </View>
            </View>

          </ScrollView>
        ) : null}

        <Modal visible={showLangPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLangPicker(false)}>
            <View style={styles.dropdownModal}>
              <Text style={styles.modalTitle}>{s.selectLang}</Text>
              {LANGUAGES.map(l => (
                <TouchableOpacity key={l.code} style={[styles.langOption, lang === l.code && styles.activeOption]} onPress={() => changeLanguage(l.code)}>
                  <Text style={styles.optionText}>{l.flag} {l.name}</Text>
                  {lang === l.code && <Ionicons name="checkmark-circle" size={20} color="#6c5ce7" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  langBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 12 },
  langBtnText: { fontSize: 20 },
  periodTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 5, marginBottom: 25 },
  periodTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 15 },
  activePeriodTab: { backgroundColor: 'rgba(108, 92, 231, 0.3)' },
  periodTabText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  activePeriodTabText: { color: '#fff' },
  premiumCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 30, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  progressContainer: { marginBottom: 15 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { color: '#aaa', fontSize: 13 },
  progressValue: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },
  predictionText: { color: '#fff', fontSize: 16, lineHeight: 26, marginBottom: 15 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  transitText: { color: '#6c5ce7', fontSize: 14, fontStyle: 'italic' },
  timingRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  timingBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 15 },
  timingBoxFull: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 15 },
  timingLabel: { color: '#666', fontSize: 11, marginBottom: 4 },
  timingValue: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  remedyGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  remedyItem: { flex: 1, backgroundColor: 'rgba(108, 92, 231, 0.1)', padding: 12, borderRadius: 15, alignItems: 'center' },
  remedyLabel: { color: '#6c5ce7', fontSize: 11, marginBottom: 4 },
  remedyValue: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  mantraLabel: { color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 5 },
  mantraValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', fontStyle: 'italic', marginBottom: 15 },
  ritualBox: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 20 },
  ritualText: { color: '#ccc', fontSize: 14, textAlign: 'center' },
  horizontalScroll: { flexDirection: 'row', gap: 15 },
  smallCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  smallCardHeader: { color: '#00cec9', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  smallCardText: { color: '#aaa', fontSize: 12, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  dropdownModal: { backgroundColor: '#1a1a2e', width: '80%', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#6c5ce7' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 8 },
  activeOption: { backgroundColor: 'rgba(108, 92, 231, 0.1)' },
  optionText: { color: '#fff', fontSize: 16 },
});
