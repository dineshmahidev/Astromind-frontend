import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Text, Alert, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLanguage } from '@/context/LanguageContext';

const { width, height } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', name: 'EN', flag: '🇬🇧' },
  { code: 'ta', name: 'TA', flag: '🇮🇳' },
  { code: 'hi', name: 'HI', flag: '🇮🇳' },
];

export default function MatchingScreen() {
  const router = useRouter();
  const { language: globalLang } = useLanguage();
  const [mode, setMode] = useState<'data' | 'manual'>('data');
  const [lang, setLang] = useState(globalLang);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [partnerData, setPartnerData] = useState({
    name: '',
    day: '', month: '', year: '',
    hour: '', minute: '',
    rasi: '', nakshatra: ''
  });
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('match_history');
      if (data) {
        const parsed = JSON.parse(data);
        // Migration: Ensure all legacy entries have a unique ID
        const migrated = parsed.map((h: any, i: number) => ({
          ...h,
          id: h.id || `match-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`
        }));
        setHistory(migrated);
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
  };

  const saveToHistory = async (newMatch: any) => {
    // Generate a unique ID for deletion
    const matchWithId = { ...newMatch, id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    const updated = [matchWithId, ...history].slice(0, 10);
    setHistory(updated);
    await AsyncStorage.setItem('match_history', JSON.stringify(updated));
  };

  const deleteHistoryEntry = async (id: string) => {
    if (!id) return;
    
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to remove this match from history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            // Use a more robust filter
            const updated = history.filter(h => h.id && h.id !== id);
            setHistory(updated);
            await AsyncStorage.setItem('match_history', JSON.stringify(updated));
          }
        }
      ]
    );
  };

  const rasis = ['Mesham', 'Rishabam', 'Mithunam', 'Kadagam', 'Simmam', 'Kanni', 'Thulaam', 'Virutchigam', 'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'];
  const rasiToNakshatra: Record<string, string[]> = {
    'Mesham': ['Aswini', 'Bharani', 'Karthigai'],
    'Rishabam': ['Karthigai', 'Rohini', 'Mirugaseerisham'],
    'Mithunam': ['Mirugaseerisham', 'Thiruvathirai', 'Punarpusam'],
    'Kadagam': ['Punarpusam', 'Poosam', 'Ayilyam'],
    'Simmam': ['Magam', 'Pooram', 'Uthiram'],
    'Kanni': ['Uthiram', 'Hastham', 'Chithirai'],
    'Thulaam': ['Chithirai', 'Swathi', 'Visakam'],
    'Virutchigam': ['Visakam', 'Anusham', 'Kettai'],
    'Dhanusu': ['Moolam', 'Pooradam', 'Uthiradam'],
    'Magaram': ['Uthiradam', 'Thiruvonam', 'Avittam'],
    'Kumbam': ['Avittam', 'Sadhayam', 'Pooratathi'],
    'Meenam': ['Pooratathi', 'Uthiratathi', 'Revathi']
  };

  const calculateMatching = async (rasi: string, star: string, targetLang = lang) => {
    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('user_astrology');
      if (!userDataStr) {
        Alert.alert('Error', 'Please set your own birth details first');
        setLoading(false);
        return;
      }
      const userData = JSON.parse(userDataStr);

      const response = await fetch(`http://10.73.33.139:8000/api/astrology/match?girl_star=${userData.nakshatra}&boy_star=${star}&lang=${targetLang}`, {
        headers: { 'Accept': 'application/json' }
      });
      const json = await response.json();

      if (json.success) {
        const poruthams = json.poruthams;
        const score = poruthams.filter((p: any) => p.status).length;
        const finalResult = {
          name: partnerData.name || result?.name,
          rasi,
          star,
          score,
          poruthams,
          summary: score >= 7 ? 'Excellent Match!' : score >= 5 ? 'Average Match' : 'Low Compatibility'
        };

        setResult(finalResult);
        setShowResult(true);
        if (!result) saveToHistory(finalResult);
      }
    } catch (e) {
      Alert.alert('Error', 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const changeReportLanguage = (newLang: string) => {
    setLang(newLang);
    if (result) {
      calculateMatching(result.rasi, result.star, newLang);
    }
  };

  const handleHistoryClick = (item: any) => {
    setResult(item);
    setShowResult(true);
  };

  const handleMatch = async () => {
    if (!partnerData.name) {
      Alert.alert('Error', 'Enter partner name');
      return;
    }

    if (mode === 'data') {
      try {
        const queryParams = new URLSearchParams({
          day: partnerData.day, month: partnerData.month, year: partnerData.year,
          hour: partnerData.hour, minute: partnerData.minute, second: '0'
        }).toString();
        const response = await fetch(`http://10.73.33.139:8000/api/astrology/details?${queryParams}`, { headers: { 'Accept': 'application/json' }});
        const json = await response.json();
        if (json.success) calculateMatching(json.data.rasi, json.data.nakshatra);
        else Alert.alert('Error', 'Calculation failed');
      } catch (e) { Alert.alert('Error', 'Backend not reachable'); }
    } else {
      if (!partnerData.rasi || !partnerData.nakshatra) {
        Alert.alert('Error', 'Select Rasi and Nakshatra');
        return;
      }
      calculateMatching(partnerData.rasi, partnerData.nakshatra);
    }
  };

  const availableNakshatras = partnerData.rasi ? rasiToNakshatra[partnerData.rasi] : [];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <CosmicBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Matching</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.label}>Partner Name</ThemedText>
          <TextInput style={styles.input} placeholder="Enter name" placeholderTextColor="#666" value={partnerData.name} onChangeText={(t) => setPartnerData({...partnerData, name: t})} />

          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, mode === 'data' && styles.activeTab]} onPress={() => setMode('data')}><Text style={[styles.tabText, mode === 'data' && styles.activeTabText]}>Birth Data</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.tab, mode === 'manual' && styles.activeTab]} onPress={() => setMode('manual')}><Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Manual</Text></TouchableOpacity>
          </View>

          {mode === 'data' ? (
            <View style={{marginTop: 15}}>
              <View style={styles.row}>
                <View style={{flex: 1}}><Text style={styles.label}>Day</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="DD" placeholderTextColor="#666" onChangeText={(t) => setPartnerData({...partnerData, day: t})}/></View>
                <View style={{flex: 1}}><Text style={styles.label}>Month</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="MM" placeholderTextColor="#666" onChangeText={(t) => setPartnerData({...partnerData, month: t})}/></View>
                <View style={{flex: 1}}><Text style={styles.label}>Year</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="YYYY" placeholderTextColor="#666" onChangeText={(t) => setPartnerData({...partnerData, year: t})}/></View>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Select Rasi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {rasis.map(r => (
                  <TouchableOpacity key={r} style={[styles.chip, partnerData.rasi === r && styles.activeChip]} onPress={() => setPartnerData({...partnerData, rasi: r, nakshatra: ''})}>
                    <Text style={[styles.chipText, partnerData.rasi === r && styles.activeChipText]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.label}>{partnerData.rasi ? `Stars in ${partnerData.rasi}` : 'Select Rasi first'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {availableNakshatras.map(n => (
                  <TouchableOpacity key={n} style={[styles.chip, partnerData.nakshatra === n && styles.activeChip]} onPress={() => setPartnerData({...partnerData, nakshatra: n})}>
                    <Text style={[styles.chipText, partnerData.nakshatra === n && styles.activeChipText]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleMatch} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Check Compatibility</Text>}
          </TouchableOpacity>
        </View>

        {history.length > 0 && (
          <View style={styles.historySection}>
            <ThemedText style={styles.sectionTitle}>Recent History</ThemedText>
            {history.map((h, i) => (
              <View key={h.id || i} style={styles.historyItemWrapper}>
                <TouchableOpacity style={styles.historyItem} onPress={() => handleHistoryClick(h)}>
                  <View>
                    <ThemedText style={styles.historyName}>{h.name}</ThemedText>
                    <ThemedText style={styles.historySub}>{h.rasi} • {h.star}</ThemedText>
                  </View>
                  <View style={styles.scoreBadge}>
                    <ThemedText style={styles.scoreText}>{h.score}/10</ThemedText>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteHistoryEntry(h.id)}>
                  <Ionicons name="trash-outline" size={20} color="#ff7675" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Modal visible={showResult} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowResult(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.modalLangs}>
                  {LANGUAGES.map(l => (
                    <TouchableOpacity 
                      key={l.code} 
                      onPress={() => changeReportLanguage(l.code)}
                      style={[styles.smallLangBtn, lang === l.code && styles.activeSmallLang]}
                    >
                      <Text style={styles.smallFlag}>{l.flag}</Text>
                      <Text style={styles.smallLangText}>{l.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
                {loading ? (
                  <View style={{marginTop: 50}}><ActivityIndicator size="large" color="#6c5ce7" /></View>
                ) : (
                  <>
                    <View style={styles.summaryBox}>
                      <ThemedText style={styles.resultName}>{result?.name}</ThemedText>
                      <View style={styles.bigScoreCircle}>
                        <ThemedText style={styles.bigScore}>{result?.score}</ThemedText>
                        <ThemedText style={styles.scoreMax}>/10</ThemedText>
                      </View>
                      <ThemedText style={styles.summaryText}>{result?.summary}</ThemedText>
                    </View>
                    <ThemedText style={styles.subTitle}>Analysis</ThemedText>
                    {result?.poruthams?.map((p: any, i: number) => (
                      <View key={i} style={styles.poruthamItem}>
                        <View style={styles.poruthamHeader}>
                          <ThemedText style={styles.poruthamName}>{p.name}</ThemedText>
                          <Ionicons name={p.status ? "checkmark-circle" : "close-circle"} size={20} color={p.status ? "#00cec9" : "#ff7675"} />
                        </View>
                        <ThemedText style={styles.poruthamDesc}>{p.desc}</ThemedText>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowResult(false)}>
                <Text style={styles.buttonText}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  title: { color: '#fff', fontSize: 28 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  label: { color: '#aaa', marginBottom: 8, fontSize: 12, marginTop: 15, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 15, color: '#fff', fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  tabRow: { flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: 'rgba(108, 92, 231, 0.3)' },
  tabText: { color: '#888', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  button: { backgroundColor: '#e84393', borderRadius: 15, padding: 18, alignItems: 'center', marginTop: 25 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  chipScroll: { marginTop: 5 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeChip: { backgroundColor: '#6c5ce7', borderColor: '#6c5ce7' },
  chipText: { color: '#aaa' },
  activeChipText: { color: '#fff', fontWeight: 'bold' },
  
  historySection: { marginTop: 40 },
  sectionTitle: { color: '#6c5ce7', fontWeight: 'bold', fontSize: 18, marginBottom: 15 },
  historyItemWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  historyItem: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 20 },
  historyName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  historySub: { color: '#888', fontSize: 12, marginTop: 2 },
  scoreBadge: { backgroundColor: 'rgba(232, 67, 147, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreText: { color: '#e84393', fontWeight: 'bold' },
  deleteBtn: { backgroundColor: 'rgba(255, 118, 117, 0.1)', padding: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255, 118, 117, 0.2)' },

  modalOverlay: { flex: 1, backgroundColor: '#0f0c29' },
  modalContent: { flex: 1, padding: 25, paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalLangs: { flexDirection: 'row', gap: 8 },
  smallLangBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeSmallLang: { backgroundColor: 'rgba(108, 92, 231, 0.3)', borderColor: '#6c5ce7' },
  smallFlag: { fontSize: 14 },
  smallLangText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  resultScroll: { flex: 1 },
  summaryBox: { alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 25, marginBottom: 25 },
  resultName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  bigScoreCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(232, 67, 147, 0.1)', justifyContent: 'center', alignItems: 'center', marginVertical: 15, flexDirection: 'row', borderWidth: 2, borderColor: '#e84393' },
  bigScore: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  scoreMax: { color: '#e84393', fontSize: 18, marginTop: 10 },
  summaryText: { color: '#ccc', textAlign: 'center', lineHeight: 22, fontSize: 15 },
  subTitle: { color: '#6c5ce7', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  poruthamItem: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 15, marginBottom: 10 },
  poruthamHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  poruthamName: { color: '#fff', fontWeight: 'bold' },
  poruthamDesc: { color: '#888', fontSize: 13 },
  closeButton: { backgroundColor: '#6c5ce7', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 15 },
});
