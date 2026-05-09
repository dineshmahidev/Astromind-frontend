import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Text, Dimensions, LayoutAnimation, Platform, UIManager, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, API_IP } from '@/constants/Config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 40) / 4;

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
];

const UI_STRINGS: Record<string, any> = {
  en: { 
    title: 'Your Kundli', chart: 'Birth Chart', dasha: 'Life Timeline', spashta: 'Graha Spashta', 
    sub: 'Sub-periods', current: 'CURRENT', selectLang: 'Select Language', viewDetail: 'View Full Analysis →',
    summary: 'Panchangam', tithi: 'Tithi', yoga: 'Yoga', karana: 'Karana', lagna: 'Lagnam', 
    yogi: 'Yogi', avayogi: 'Avayogi', star: 'Nakshatra', rasi: 'Rasi'
  },
  ta: { 
    title: 'ஜாதகம்', chart: 'பிறப்பு ஜாதகம்', dasha: 'வாழ்க்கை பயணம்', spashta: 'கிரக நிலை', 
    sub: 'புத்திகள்', current: 'இப்போது', selectLang: 'மொழியைத் தேர்ந்தெடுக்கவும்', viewDetail: 'முழு விளக்கத்தை வாசிக்க →',
    summary: 'பஞ்சாங்கம்', tithi: 'திதி', yoga: 'யோகம்', karana: 'கரணம்', lagna: 'லக்னம்', 
    yogi: 'யோகி', avayogi: 'அவயோகி', star: 'நட்சத்திரம்', rasi: 'ராசி'
  },
  hi: { 
    title: 'आपकी कुंडली', chart: 'जन्म कुंडली', dasha: 'जीवन यात्रा', spashta: 'ग्रह स्थिति', 
    sub: 'भुक्ति', current: 'वर्तमान', selectLang: 'भाषा चुनें', viewDetail: 'पूरा विवरण देखें →',
    summary: 'पंचांग', tithi: 'तिथि', yoga: 'योग', karana: 'करण', lagna: 'लग्न', 
    yogi: 'योगी', avayogi: 'अव्योगी', star: 'नक्षत्र', rasi: 'राशि'
  },
};

export default function KundliScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'dasha'>('chart');
  const [chartData, setChartData] = useState<any>(null);
  const [planetDetails, setPlanetDetails] = useState<any[]>([]);
  const [dashaData, setDashaData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [expandedDasha, setExpandedDasha] = useState<number | null>(null);

  useEffect(() => {
    loadLanguage();
  }, []);

  useEffect(() => {
    fetchChart(lang);
  }, [lang]);

  const loadLanguage = async () => {
    const saved = await AsyncStorage.getItem('app_lang');
    if (saved) setLang(saved);
  };

  const changeLanguage = async (code: string) => {
    setLang(code);
    await AsyncStorage.setItem('app_lang', code);
    setShowLangPicker(false);
  };

  const fetchChart = async (targetLang: string) => {
    setLoading(true);
    try {
      const birthDetails = await AsyncStorage.getItem('birth_details');
      if (!birthDetails) {
        setLoading(false);
        setChartData('missing'); // Special state for missing details
        return;
      }
      const details = JSON.parse(birthDetails);
      const queryParams = new URLSearchParams({
        day: details.day, month: details.month, year: details.year,
        hour: details.hour, minute: details.minute, lang: targetLang
      }).toString();

      const response = await fetch(`${BASE_URL}/astrology/chart?${queryParams}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server Error Response:', errorText);
        throw new Error(`Server returned ${response.status}`);
      }

      const json = await response.json();
      if (json.success && json.data) {
        setChartData(json.data.chart || null);
        setPlanetDetails(json.data.details || []);
        setDashaData(json.data.dasha || []);
        setSummaryData(json.data.summary || null);
      } else {
        setChartData(null);
        setSummaryData(null);
      }
    } catch (e) {
      console.error('Kundli Fetch Error:', e);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleDasha = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDasha(expandedDasha === index ? null : index);
  };

  const navigateToBhukti = async (bhukti: any) => {
    await AsyncStorage.setItem('temp_bhukti', JSON.stringify(bhukti));
    router.push('/bhukti-details');
  };

  const getPlanetsInHouse = (rasiIdx: number) => {
    if (!chartData) return [];
    const planets: string[] = [];
    Object.entries(chartData).forEach(([name, data]: [string, any]) => {
      if (data.rasi === rasiIdx) { planets.push(name.substring(0, 2)); }
    });
    return planets;
  };

  const RasiCell = ({ idx, name, isCenter = false }: { idx?: number, name: string, isCenter?: boolean }) => {
    if (isCenter) return <View style={[styles.cell, styles.centerCell]} />;
    const planets = idx !== undefined ? getPlanetsInHouse(idx) : [];
    return (
      <View style={styles.cell}>
        <Text style={styles.rasiName}>{name}</Text>
        <View style={styles.planetsList}>
          {planets.map((p, i) => (
            <Text key={i} style={styles.planetText}>{p}</Text>
          ))}
        </View>
      </View>
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
  };

  const s = UI_STRINGS[lang];
  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>{s.title}</ThemedText>
          </View>
          
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowLangPicker(true)}>
            <Text style={styles.dropdownText}>{currentLang?.flag} {currentLang?.name.split(' ')[0]}</Text>
            <Ionicons name="chevron-down" size={16} color="#aaa" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'chart' && styles.activeTab]} onPress={() => setActiveTab('chart')}>
            <Text style={[styles.tabText, activeTab === 'chart' && styles.activeTabText]}>{s.chart}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'dasha' && styles.activeTab]} onPress={() => setActiveTab('dasha')}>
            <Text style={[styles.tabText, activeTab === 'dasha' && styles.activeTabText]}>{s.dasha}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ marginTop: 100, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loaderText}>Consulting the Stars...</Text>
          </View>
        ) : chartData === 'missing' ? (
          <View style={styles.errorBox}>
            <Ionicons name="person-add-outline" size={60} color="#6c5ce7" style={{ marginBottom: 20 }} />
            <ThemedText style={{ textAlign: 'center', marginBottom: 10, fontWeight: 'bold' }}>Details Missing</ThemedText>
            <ThemedText style={{ textAlign: 'center', marginBottom: 25, color: '#888' }}>
              We need your birth date and time to generate your personalized Kundli.
            </ThemedText>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => router.push('/birth-details')}
            >
              <Text style={styles.retryText}>Set Birth Details</Text>
            </TouchableOpacity>
          </View>
        ) : !chartData ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={60} color="#ff7675" style={{ marginBottom: 20 }} />
            <ThemedText style={{ textAlign: 'center', marginBottom: 10, fontWeight: 'bold' }}>Connection Issue</ThemedText>
            <ThemedText style={{ textAlign: 'center', marginBottom: 25, color: '#888' }}>
              The app can't reach the server at {API_IP}:8000. Ensure your local server is running and your phone is on the same network.
            </ThemedText>
            
            <TouchableOpacity 
              style={[styles.retryButton, { marginBottom: 15 }]}
              onPress={() => fetchChart(lang)}
            >
              <Text style={styles.retryText}>Try Reconnecting</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#6c5ce7' }]}
              onPress={() => router.push('/birth-details')}
            >
              <Text style={[styles.retryText, { color: '#6c5ce7' }]}>Update Birth Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
            {summaryData && (
              <View style={styles.panchangSection}>
                <View style={styles.panchangHeader}>
                  <View>
                    <ThemedText style={styles.panchangTitle}>{s.summary}</ThemedText>
                    <ThemedText style={styles.panchangSub}>Celestial Alignment at Birth</ThemedText>
                  </View>
                  <Ionicons name="calendar-outline" size={32} color="#FFD700" opacity={0.5} />
                </View>
                
                <View style={styles.panchangList}>
                  <PanchangRow label={s.rasi} value={lang === 'ta' ? summaryData.rasi_ta : summaryData.rasi} icon="moon-outline" color="#a29bfe" />
                  <PanchangRow label={s.star} value={summaryData.nakshatra} icon="star-outline" color="#f1c40f" />
                  <PanchangRow label={s.lagna} value={lang === 'ta' ? summaryData.lagna_ta : summaryData.lagna} icon="sunny-outline" color="#e67e22" />
                  <PanchangRow label={s.tithi} value={summaryData.tithi_name} icon="partly-sunny-outline" color="#00cec9" />
                  <PanchangRow label={s.yoga} value={summaryData.yoga} icon="infinite-outline" color="#ff7675" />
                  <PanchangRow label={s.karana} value={summaryData.karana} icon="flash-outline" color="#fab1a0" />
                </View>

                <View style={styles.yogiSection}>
                   <View style={styles.yogiBox}>
                      <ThemedText style={styles.yogiLabel}>{s.yogi}</ThemedText>
                      <ThemedText style={[styles.yogiValue, { color: '#4cd137' }]}>{summaryData.yogi}</ThemedText>
                   </View>
                   <View style={[styles.yogiBox, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' }]}>
                      <ThemedText style={styles.yogiLabel}>{s.avayogi}</ThemedText>
                      <ThemedText style={[styles.yogiValue, { color: '#e84118' }]}>{summaryData.avayogi}</ThemedText>
                   </View>
                </View>
              </View>
            )}

            {activeTab === 'chart' ? (
              <>
                <View style={styles.chartContainer}>
                  {dashaData.find(d => new Date() > new Date(d.start) && new Date() < new Date(d.end)) && (
                    <TouchableOpacity 
                      style={styles.currentDashaBanner}
                      onPress={() => setActiveTab('dasha')}
                    >
                      <View style={styles.dashaBadge}>
                        <Ionicons name="time-outline" size={16} color="#fff" />
                        <Text style={styles.dashaBadgeText}>Active Dasha</Text>
                      </View>
                      <Text style={styles.dashaPreviewText}>
                        {dashaData.find(d => new Date() > new Date(d.start) && new Date() < new Date(d.end))?.planet} Dasha
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.row}>
                    <RasiCell idx={11} name="Meenam" /><RasiCell idx={0} name="Mesham" /><RasiCell idx={1} name="Rishab" /><RasiCell idx={2} name="Mithun" />
                  </View>
                  <View style={styles.row}>
                    <RasiCell idx={10} name="Kumbam" /><RasiCell name="" isCenter /><RasiCell name="" isCenter /><RasiCell idx={3} name="Kadag" />
                  </View>
                  <View style={styles.row}>
                    <RasiCell idx={9} name="Magar" /><RasiCell name="" isCenter /><RasiCell name="" isCenter /><RasiCell idx={4} name="Simma" />
                  </View>
                  <View style={styles.row}>
                    <RasiCell idx={8} name="Dhanus" /><RasiCell idx={7} name="Virut" /><RasiCell idx={6} name="Thula" /><RasiCell idx={5} name="Kanni" />
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <ThemedText style={styles.sectionTitle}>{s.spashta}</ThemedText>
                  {planetDetails.map((p, i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.planetName, { flex: 1.2 }]}>{p.name}</Text>
                      <View style={{ flex: 1.5 }}><Text style={styles.tableValue}>{p.rasi}</Text><Text style={styles.tableSubValue}>{p.degree}</Text></View>
                      <View style={{ flex: 2 }}><Text style={styles.tableValue}>{p.nakshatra}</Text><Text style={styles.tableSubValue}>Padam {p.padam}</Text></View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.timelineContainer}>
                {dashaData.map((d, i) => {
                  const isCurrent = new Date() > new Date(d.start) && new Date() < new Date(d.end);
                  const isExpanded = expandedDasha === i;
                  return (
                    <View key={i} style={[styles.dashaCard, isCurrent && styles.activeDashaCard, isExpanded && styles.expandedCard]}>
                      <TouchableOpacity onPress={() => toggleDasha(i)}>
                        <View style={styles.dashaHeader}>
                          <View style={styles.planetBadge}><Text style={styles.planetBadgeText}>{d.planet}</Text></View>
                          <View style={styles.headerRight}>
                            {isCurrent && <View style={styles.nowBadge}><Text style={styles.nowText}>{s.current}</Text></View>}
                            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#fff" />
                          </View>
                        </View>
                        <View style={styles.dashaDates}><Text style={styles.dateRange}>{d.start}  —  {d.end}</Text></View>
                        <Text style={styles.dashaDesc} numberOfLines={isExpanded ? undefined : 2}>{d.description}</Text>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.expandedContent}>
                          <View style={styles.bhuktiContainer}>
                            <View style={styles.bhuktiHeader}><Text style={styles.bhuktiTitle}>{s.sub}</Text></View>
                            {d.bhuktis?.map((b: any, j: number) => (
                              <TouchableOpacity key={j} style={styles.bhuktiCardSimple} onPress={() => navigateToBhukti(b)}>
                                <View style={styles.bhuktiMain}>
                                  <View style={styles.bhuktiIndicator} />
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.bhuktiName}>{b.planet}</Text>
                                    <Text style={styles.bhuktiDate}>{b.start} - {b.end}</Text>
                                  </View>
                                  <Ionicons name="chevron-forward" size={18} color="#6c5ce7" />
                                </View>
                                <Text style={styles.viewDetailText}>{s.viewDetail}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

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

function PanchangRow({ label, value, icon, color }: any) {
  return (
    <View style={styles.panchangRow}>
      <View style={[styles.panchangIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.panchangMain}>
        <Text style={styles.panchangLabel}>{label}</Text>
        <Text style={styles.panchangValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  dropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dropdownText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  loaderText: { color: '#FFD700', marginTop: 15, fontSize: 16, fontWeight: '500' },
  
  panchangSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  panchangHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  panchangTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  panchangSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  panchangList: {
    gap: 12,
  },
  panchangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 18,
    gap: 15,
  },
  panchangIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panchangMain: {
    flex: 1,
  },
  panchangLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  panchangValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  yogiSection: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  yogiBox: {
    flex: 1,
    alignItems: 'center',
  },
  yogiLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  yogiValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 5,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 15 },
  activeTab: { backgroundColor: 'rgba(108, 92, 231, 0.3)' },
  tabText: { color: '#888', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  mainScroll: { flex: 1 },
  chartContainer: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 25, padding: 5, borderWidth: 2, borderColor: '#6c5ce7', marginBottom: 30, overflow: 'hidden' },
  currentDashaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 92, 231, 0.3)',
    gap: 12,
  },
  dashaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  dashaBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dashaPreviewText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  row: { flexDirection: 'row' },
  cell: { width: GRID_SIZE, height: GRID_SIZE, borderSize: 1, borderColor: 'rgba(108, 92, 231, 0.3)', borderWidth: 0.5, padding: 5, justifyContent: 'space-between' },
  centerCell: { backgroundColor: 'rgba(108, 92, 231, 0.02)', borderWidth: 0.5, borderColor: 'rgba(108, 92, 231, 0.2)' },
  rasiName: { color: 'rgba(108, 92, 231, 0.6)', fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },
  planetsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  planetText: { color: '#fff', fontSize: 13, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 },
  detailsSection: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { color: '#6c5ce7', fontWeight: 'bold', marginBottom: 20, fontSize: 18 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  planetName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  tableValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  tableSubValue: { color: '#888', fontSize: 11, marginTop: 2 },
  timelineContainer: { gap: 15 },
  dashaCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 30, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  activeDashaCard: { borderColor: '#6c5ce7', backgroundColor: 'rgba(108, 92, 231, 0.1)' },
  expandedCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  dashaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planetBadge: { backgroundColor: '#6c5ce7', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 12 },
  planetBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  nowBadge: { backgroundColor: '#00cec9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  nowText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  dashaDates: { marginBottom: 10 },
  dateRange: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dashaDesc: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  expandedContent: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  bhuktiContainer: { marginTop: 10 },
  bhuktiHeader: { marginBottom: 15 },
  bhuktiTitle: { color: '#e84393', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' },
  bhuktiCardSimple: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  bhuktiMain: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  bhuktiIndicator: { width: 4, height: 30, backgroundColor: '#6c5ce7', borderRadius: 2 },
  bhuktiName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bhuktiDate: { color: '#666', fontSize: 12 },
  viewDetailText: { color: '#6c5ce7', fontSize: 12, marginTop: 10, fontWeight: 'bold', textAlign: 'right' },
  errorBox: { marginTop: 50, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  dropdownModal: { backgroundColor: '#1a1a2e', width: '80%', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#6c5ce7' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 8 },
  activeOption: { backgroundColor: 'rgba(108, 92, 231, 0.1)' },
  optionText: { color: '#fff', fontSize: 16 },
  retryButton: { backgroundColor: '#6c5ce7', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15, marginTop: 10 },
  retryText: { color: '#fff', fontWeight: 'bold' },
});
