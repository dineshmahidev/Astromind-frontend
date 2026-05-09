// Force refresh
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '@/constants/translations';
import { useLanguage } from '@/context/LanguageContext';
import { BASE_URL } from '@/constants/Config';

const { width } = Dimensions.get('window');

export default function MarriageScreen() {
  const router = useRouter();
  const { language: lang, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [form, setForm] = useState({ day: '', month: '', year: '', hour: '', minute: '' });

  const predict = async () => {
    const { day, month, year, hour, minute } = form;
    if (!day || !month || !year || !hour || !minute) {
      Alert.alert('Error', 'Please fill all birth details');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/marriage/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          day: parseInt(day), 
          month: parseInt(month), 
          year: parseInt(year), 
          hour: parseInt(hour), 
          minute: parseInt(minute), 
          gender,
          lang // Send selected language to backend
        }),
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else Alert.alert('Error', json.message || 'Prediction failed');
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const loadFromProfile = async () => {
    const raw = await AsyncStorage.getItem('birth_details');
    if (raw) {
      const b = JSON.parse(raw);
      setForm({ day: String(b.day), month: String(b.month), year: String(b.year), hour: String(b.hour), minute: String(b.minute) });
    }
  };

  const ScoreRing = ({ score }: { score: number }) => {
    const color = score >= 80 ? '#00b894' : score >= 60 ? '#fdcb6e' : '#ff7675';
    return (
      <View style={styles.ringWrap}>
        <View style={[styles.ring, { borderColor: color }]}>
          <Text style={[styles.ringScore, { color }]}>{score}%</Text>
          <Text style={styles.ringLabel}>{t.happy_life}</Text>
        </View>
      </View>
    );
  };

  return (
    <CosmicBackground>
      <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>💍 {t.marriage_report}</Text>
            <Text style={styles.sub}>Vedic Astrology Analysis</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* INPUT FORM */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={18} color="#6c5ce7" />
              <Text style={styles.cardTitle}>{t.enter_birth}</Text>
            </View>

            <TouchableOpacity style={styles.autoFillBtn} onPress={loadFromProfile}>
              <Ionicons name="person" size={14} color="#00cec9" />
              <Text style={styles.autoFillText}>{t.auto_fill}</Text>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              {[['Day', 'day', 2], ['Month', 'month', 2], ['Year', 'year', 4]].map(([lbl, key, ml]) => (
                <View key={key as string} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{lbl as string}</Text>
                  <TextInput style={styles.input} placeholder={lbl as string} placeholderTextColor="#444" keyboardType="numeric" maxLength={ml as number} value={(form as any)[key as string]} onChangeText={(v) => setForm({ ...form, [key as string]: v })} />
                </View>
              ))}
            </View>

            <View style={styles.inputRow}>
              {[['Hour (24h)', 'hour', 2], ['Minute', 'minute', 2]].map(([lbl, key, ml]) => (
                <View key={key as string} style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{lbl as string}</Text>
                  <TextInput style={styles.input} placeholder={lbl as string} placeholderTextColor="#444" keyboardType="numeric" maxLength={ml as number} value={(form as any)[key as string]} onChangeText={(v) => setForm({ ...form, [key as string]: v })} />
                </View>
              ))}
            </View>

            {/* GENDER */}
            <View style={styles.genderRow}>
              {['male', 'female'].map(g => (
                <TouchableOpacity key={g} onPress={() => setGender(g as 'male' | 'female')} style={[styles.genderBtn, gender === g && styles.genderBtnActive]}>
                  <Ionicons name={g === 'male' ? 'male' : 'female'} size={16} color={gender === g ? '#fff' : '#666'} />
                  <Text style={[styles.genderText, gender === g && { color: '#fff' }]}>{g === 'male' ? 'Male' : 'Female'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.predictBtn} onPress={predict}>
              {loading ? <ActivityIndicator color="#fff" /> : <>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.predictText}>{t.generate_report}</Text>
              </>}
            </TouchableOpacity>
          </View>

          {data && <>
            {/* BIRTH INFO */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌙 {t.birth_info}</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoBox}><Text style={styles.infoVal}>{data.birth_info?.rasi}</Text><Text style={styles.infoKey}>{t.rasi}</Text></View>
                <View style={styles.infoBox}><Text style={styles.infoVal}>{data.birth_info?.nakshatra}</Text><Text style={styles.infoKey}>{t.star}</Text></View>
                <View style={styles.infoBox}><Text style={styles.infoVal}>{data.birth_info?.lagna}</Text><Text style={styles.infoKey}>{t.lagna}</Text></View>
                <View style={styles.infoBox}><Text style={styles.infoVal}>{data.birth_info?.padam}</Text><Text style={styles.infoKey}>{t.padam}</Text></View>
              </View>
            </View>

            {/* MARRIAGE PROMISE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💍 {t.marriage_promise}</Text>
              <View style={[styles.statusBadge, { backgroundColor: data.promised_marriage ? 'rgba(0,184,148,0.15)' : 'rgba(255,118,118,0.15)' }]}>
                <Ionicons name={data.promised_marriage ? 'checkmark-circle' : 'close-circle'} size={22} color={data.promised_marriage ? '#00b894' : '#ff7675'} />
                <Text style={[styles.statusText, { color: data.promised_marriage ? '#00b894' : '#ff7675' }]}>
                  {data.promised_marriage ? (lang === 'ta' ? 'திருமண யோகம் உள்ளது ✅' : lang === 'hi' ? 'विवाह योग मौजूद है ✅' : 'Marriage is Promised ✅') : (lang === 'ta' ? 'தடைகள் உள்ளன' : lang === 'hi' ? 'विवाह में बाधाएं' : 'Obstacles in Marriage')}
                </Text>
              </View>
              {data.promised_reasons?.map((r: string, i: number) => (
                <View key={i} style={styles.reasonRow}><Text style={styles.dot}>✓</Text><Text style={styles.reasonText}>{r}</Text></View>
              ))}
              {data.denied_reasons?.length > 0 && <>
                <Text style={[styles.sectionLabel, { color: '#ff7675', marginTop: 10 }]}>⚠️ {lang === 'ta' ? 'கவலைகள்:' : lang === 'hi' ? 'चिंताएं:' : 'Concerns:'}</Text>
                {data.denied_reasons.map((r: string, i: number) => (
                  <View key={i} style={styles.reasonRow}><Text style={[styles.dot, { color: '#ff7675' }]}>!</Text><Text style={styles.reasonText}>{r}</Text></View>
                ))}
              </>}
            </View>

            {/* DELAY */}
            {data.is_delayed && (
              <View style={[styles.card, { borderColor: 'rgba(253,203,110,0.3)' }]}>
                <Text style={styles.cardTitle}>⏳ {lang === 'ta' ? 'தாமத திருமணம்' : lang === 'hi' ? 'विवाह में देरी' : 'Delayed Marriage'}</Text>
                {data.delayed_reasons?.map((r: string, i: number) => (
                  <View key={i} style={styles.reasonRow}><Text style={[styles.dot, { color: '#fdcb6e' }]}>⚠</Text><Text style={styles.reasonText}>{r}</Text></View>
                ))}
              </View>
            )}

            {/* LOVE vs ARRANGED + SCORE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>❤️ {t.love_or_arranged}</Text>
              <View style={styles.loveRow}>
                <View style={[styles.loveBadge, { backgroundColor: data.love_or_arranged === 'Love Marriage' ? 'rgba(255,118,118,0.2)' : 'rgba(108,92,231,0.2)' }]}>
                  <Text style={styles.loveBadgeText}>{data.love_or_arranged}</Text>
                  <Text style={styles.loveConf}>{data.love_confidence}% {t.likely}</Text>
                </View>
                <ScoreRing score={data.married_life_score} />
              </View>
            </View>

            {/* TIMING */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📅 {t.timing}</Text>
              <View style={styles.timingBadge}>
                <Ionicons name="time" size={18} color="#6c5ce7" />
                <Text style={styles.timingAge}>{t.expected_age}: {data.marriage_timing?.age_range}</Text>
              </View>
              {data.marriage_timing?.favorable_dashas?.map((d: string, i: number) => (
                <View key={i} style={styles.reasonRow}><Text style={styles.dot}>🌟</Text><Text style={styles.reasonText}>{d}</Text></View>
              ))}
            </View>

            {/* SPOUSE NATURE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👤 {t.spouse_nature}</Text>
              <Text style={styles.spouseDesc}>{data.spouse_nature?.description}</Text>
              <View style={styles.traitWrap}>
                {data.spouse_nature?.personality?.map((t: string, i: number) => (
                  <View key={i} style={styles.trait}><Text style={styles.traitText}>{t}</Text></View>
                ))}
              </View>
              <Text style={styles.spouseExtra}>👁️ {t.appearance}: {data.spouse_nature?.appearance}</Text>
              <Text style={styles.spouseExtra}>🧭 {t.direction}: {data.spouse_nature?.direction}</Text>
            </View>

            {/* MANGAL DOSHA */}
            <View style={[styles.card, { borderColor: data.mangal_dosha ? 'rgba(255,71,87,0.4)' : 'rgba(0,184,148,0.3)' }]}>
              <Text style={styles.cardTitle}>🔴 {t.mangal_dosha}</Text>
              <View style={[styles.statusBadge, { backgroundColor: data.mangal_dosha ? 'rgba(255,71,87,0.15)' : 'rgba(0,184,148,0.15)' }]}>
                <Ionicons name={data.mangal_dosha ? 'warning' : 'shield-checkmark'} size={20} color={data.mangal_dosha ? '#ff4757' : '#00b894'} />
                <Text style={[styles.statusText, { color: data.mangal_dosha ? '#ff4757' : '#00b894' }]}>
                  {data.mangal_dosha ? (lang === 'ta' ? `செவ்வாய் தோஷம் உள்ளது (${data.mangal_severity})` : lang === 'hi' ? `मंगल दोष मौजूद है (${data.mangal_severity})` : `Mangal Dosha Present (${data.mangal_severity})`) : (lang === 'ta' ? 'தோஷம் இல்லை ✅' : lang === 'hi' ? 'कोई दोष नहीं ✅' : 'No Mangal Dosha ✅')}
                </Text>
              </View>
            </View>

            {/* REMEDIES */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🙏 {t.remedies}</Text>
              {data.remedies?.map((r: string, i: number) => (
                <View key={i} style={styles.remedyRow}><Text style={styles.remedyText}>{r}</Text></View>
              ))}
            </View>

            {/* ── PEAK MARRIAGE DAYS ── */}
            {data.peak_marriage_days && (
              <View style={[styles.card, { borderColor: 'rgba(253,203,110,0.3)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 20 }}>📅</Text>
                  <Text style={styles.cardTitle}>{t.peak_dates}</Text>
                </View>

                {/* DASHA WINDOW */}
                {data.peak_marriage_days.marriage_dasha && (
                  <View style={styles.dashaBanner}>
                    <Ionicons name="planet" size={20} color="#fdcb6e" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dashaTitle}>
                        🌟 {data.peak_marriage_days.marriage_dasha.planet} Mahadasha
                      </Text>
                      <Text style={styles.dashaRange}>
                        {data.peak_marriage_days.marriage_dasha.start} → {data.peak_marriage_days.marriage_dasha.end}
                      </Text>
                      <Text style={styles.dashaMsg}>
                        {data.peak_marriage_days.marriage_dasha.planet} Mahadasha {t.destined_during}
                      </Text>
                    </View>
                  </View>
                )}

                {/* DASHA TIMELINE */}
                <Text style={styles.sectionLabel}>📊 {t.full_timeline}:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {data.peak_marriage_days.dasha_timeline?.map((d: any, i: number) => (
                      <View key={i} style={[styles.dashaChip, d.is_marriage_dasha && styles.dashaChipActive]}>
                        <Text style={[styles.dashaChipPlanet, d.is_marriage_dasha && { color: '#fff' }]}>{d.planet}</Text>
                        <Text style={[styles.dashaChipRange, d.is_marriage_dasha && { color: 'rgba(255,255,255,0.8)' }]}>{d.start}</Text>
                        <Text style={[styles.dashaChipRange, d.is_marriage_dasha && { color: 'rgba(255,255,255,0.8)' }]}>{d.end}</Text>
                        {d.is_marriage_dasha && <Text style={styles.dashaMarker}>💍</Text>}
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* PEAK DATES */}
                <Text style={styles.sectionLabel}>🌸 {t.best_muhurta}:</Text>
                {data.peak_marriage_days.peak_dates?.map((d: any, i: number) => (
                  <View key={i} style={[styles.peakDayCard, { borderLeftColor: d.quality_color }]}>
                    <View style={styles.peakDayTop}>
                      <View style={[styles.peakRankBadge, { backgroundColor: i === 0 ? '#fdcb6e' : i === 1 ? '#b2bec3' : i === 2 ? '#e17055' : 'rgba(255,255,255,0.07)' }]}>
                        <Text style={[styles.peakRank, { color: i < 3 ? '#000' : '#888' }]}>#{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.peakDate}>{d.date}</Text>
                        <Text style={styles.peakDay}>{d.day} • {d.dasha_context}</Text>
                      </View>
                      <View style={[styles.peakQualityBadge, { backgroundColor: d.quality_color + '22', borderColor: d.quality_color + '55' }]}>
                        <Text style={[styles.peakQuality, { color: d.quality_color }]}>{d.quality}</Text>
                      </View>
                    </View>
                    <View style={styles.peakDetails}>
                      <View style={styles.peakDetail}><Text style={styles.peakDetailLabel}>Tithi</Text><Text style={styles.peakDetailVal}>{d.tithi}</Text></View>
                      <View style={styles.peakDetail}><Text style={styles.peakDetailLabel}>Star</Text><Text style={styles.peakDetailVal}>{d.nakshatra}</Text></View>
                      <View style={styles.peakDetail}><Text style={styles.peakDetailLabel}>Yoga</Text><Text style={styles.peakDetailVal}>{d.yoga}</Text></View>
                      <View style={styles.peakDetail}><Text style={styles.peakDetailLabel}>Score</Text><Text style={[styles.peakDetailVal, { color: d.quality_color }]}>{d.score}/100</Text></View>
                    </View>
                  </View>
                ))}
                <Text style={{ color: '#555', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                  * Exact muhurta requires local panchang & sunrise verification
                </Text>
              </View>
            )}
          </>}
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20, backgroundColor: 'rgba(10,10,26,0.95)' },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sub: { color: '#888', fontSize: 12 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 18, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  autoFillBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, alignSelf: 'flex-end' },
  autoFillText: { color: '#00cec9', fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputGroup: { flex: 1 },
  inputLabel: { color: '#888', fontSize: 11, marginBottom: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 15, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 15, marginTop: 5 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  genderBtnActive: { backgroundColor: '#6c5ce7', borderColor: '#6c5ce7' },
  genderText: { color: '#666', fontWeight: '600' },
  predictBtn: { backgroundColor: '#6c5ce7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 18, marginTop: 5 },
  predictText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoBox: { alignItems: 'center', flex: 1 },
  infoVal: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  infoKey: { color: '#666', fontSize: 11, marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, marginBottom: 12 },
  statusText: { fontWeight: 'bold', fontSize: 14, flex: 1 },
  sectionLabel: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 5 },
  reasonRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  dot: { color: '#00b894', fontSize: 14, marginTop: 1 },
  reasonText: { color: '#bbb', fontSize: 13, flex: 1, lineHeight: 20 },
  loveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loveBadge: { flex: 1, borderRadius: 14, padding: 15, marginRight: 12 },
  loveBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loveConf: { color: '#aaa', fontSize: 12, marginTop: 4 },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  ringScore: { fontWeight: 'bold', fontSize: 18 },
  ringLabel: { color: '#888', fontSize: 9, marginTop: 2 },
  timingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(108,92,231,0.1)', padding: 12, borderRadius: 14, marginBottom: 12 },
  timingAge: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  spouseDesc: { color: '#aaa', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  traitWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  trait: { backgroundColor: 'rgba(108,92,231,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  traitText: { color: '#6c5ce7', fontSize: 12, fontWeight: '600' },
  spouseExtra: { color: '#888', fontSize: 13, marginTop: 5 },
  remedyRow: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 8 },
  remedyText: { color: '#ddd', fontSize: 13, lineHeight: 20 },

  // Dasha Banner
  dashaBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(253, 203, 110, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(253, 203, 110, 0.2)',
  },
  dashaTitle: { color: '#fdcb6e', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  dashaRange: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  dashaMsg: { color: '#aaa', fontSize: 12, lineHeight: 18 },

  // Dasha Timeline
  dashaChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 14,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dashaChipActive: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  dashaChipPlanet: { color: '#888', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  dashaChipRange: { color: '#666', fontSize: 10 },
  dashaMarker: { position: 'absolute', top: -8, right: -5, fontSize: 16 },

  // Peak Marriage Days
  peakDayCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  peakDayTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  peakRankBadge: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  peakRank: { fontWeight: 'bold', fontSize: 12 },
  peakDate: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  peakDay: { color: '#888', fontSize: 12, marginTop: 2 },
  peakQualityBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  peakQuality: { fontSize: 11, fontWeight: 'bold' },
  peakDetails: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  peakDetail: { alignItems: 'center', minWidth: 70 },
  peakDetailLabel: { color: '#555', fontSize: 10, marginBottom: 2 },
  peakDetailVal: { color: '#bbb', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
