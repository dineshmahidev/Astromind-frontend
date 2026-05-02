import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BhuktiDetailsScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedData = await AsyncStorage.getItem('temp_bhukti');
    const savedLang = await AsyncStorage.getItem('app_lang') || 'en';
    if (savedData) {
      setData(JSON.parse(savedData));
    }
    setLang(savedLang);
  };

  const handleBack = () => {
    router.back();
  };

  if (!data) {
    return (
      <CosmicBackground>
        <ActivityIndicator size="large" color="#6c5ce7" style={{ marginTop: 100 }} />
      </CosmicBackground>
    );
  }

  const UI_STRINGS: any = {
    en: { title: 'Sub-period Details', phase: 'Month-wise Timeline', dates: 'Period Dates', analysis: 'Overall Analysis' },
    ta: { title: 'புத்தி விளக்கங்கள்', phase: 'மாதாந்திர காலவரிசை', dates: 'புத்தி காலம்', analysis: 'ஒட்டுமொத்த ஆய்வு' },
    hi: { title: 'भुक्ति विवरण', phase: 'मासिक समयरेखा', dates: 'भुक्ति अवधि', analysis: 'समग्र विश्लेषण' }
  };

  const s = UI_STRINGS[lang];

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>{s.title}</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.mainCard}>
            <View style={styles.planetBadge}>
              <Text style={styles.planetIcon}>✨</Text>
              <Text style={styles.planetName}>{data.planet}</Text>
            </View>
            <Text style={styles.dateRange}>{data.start} — {data.end}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>🎯 {s.analysis}</Text>
            <Text style={styles.fullDesc}>{data.desc}</Text>
          </View>

          <Text style={styles.phaseHeader}>📊 {s.phase}</Text>
          
          <View style={styles.timelineWrapper}>
            {data.segments?.map((seg: any, idx: number) => (
              <View key={idx} style={styles.monthCard}>
                <View style={styles.monthHeader}>
                  <View style={styles.monthCircle}>
                    <Text style={styles.monthNumber}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.monthTitle}>{seg.title}</Text>
                    <Text style={styles.monthDates}>{seg.dates}</Text>
                  </View>
                </View>
                <Text style={styles.monthDesc}>{seg.desc}</Text>
                
                {idx < data.segments.length - 1 && <View style={styles.timelineConnector} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  mainCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 30 },
  planetBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  planetIcon: { fontSize: 24 },
  planetName: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  dateRange: { color: '#6c5ce7', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  sectionTitle: { color: '#00cec9', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  fullDesc: { color: '#fff', fontSize: 16, lineHeight: 26, opacity: 0.9 },
  phaseHeader: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 25, marginLeft: 5 },
  timelineWrapper: { paddingLeft: 10 },
  monthCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  monthCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6c5ce7', justifyContent: 'center', alignItems: 'center', shadowColor: '#6c5ce7', shadowRadius: 10, shadowOpacity: 0.5, elevation: 5 },
  monthNumber: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  monthTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  monthDates: { color: '#666', fontSize: 11, marginTop: 2 },
  monthDesc: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  timelineConnector: { position: 'absolute', left: 28, bottom: -25, width: 2, height: 25, backgroundColor: 'rgba(108, 92, 231, 0.2)' },
});
