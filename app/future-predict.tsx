import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Platform, Modal, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import Animated, { FadeInDown, FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_IP, BASE_URL } from '@/constants/Config';

const { width, height } = Dimensions.get('window');

const QUESTION_CATEGORIES = [
  // ... existing categories (career, love, health, wealth, family, education, travel)
  {
    id: 'career',
    title_en: 'Career & Finance',
    title_ta: 'தொழில் மற்றும் நிதி',
    icon: 'briefcase',
    color: '#6c5ce7',
    questions: [
      { en: 'When will I get a new job?', ta: 'எனக்கு எப்போது புதிய வேலை கிடைக்கும்?' },
      { en: 'Will I be successful in my business?', ta: 'எனது தொழிலில் நான் வெற்றி பெறுவேனா?' },
      { en: 'When will my financial status improve?', ta: 'எனது நிதி நிலை எப்போது உயரும்?' },
      { en: 'Is it a good time to invest?', ta: 'முதலீடு செய்ய இது சரியான நேரமா?' },
    ]
  },
  {
    id: 'love',
    title_en: 'Love & Relationship',
    title_ta: 'காதல் மற்றும் உறவு',
    icon: 'heart',
    color: '#e84393',
    questions: [
      { en: 'When will I meet my soulmate?', ta: 'எனது ஆத்மார்த்தமான துணையை நான் எப்போது சந்திப்பேன்?' },
      { en: 'Will I have a love or arranged marriage?', ta: 'எனக்கு காதல் திருமணமா அல்லது நிச்சயிக்கப்பட்ட திருமணமா?' },
      { en: 'How will my relationship with my partner be?', ta: 'எனது துணையுடனான உறவு எப்படி இருக்கும்?' },
      { en: 'Is there any problem in my married life?', ta: 'எனது திருமண வாழ்க்கையில் ஏதேனும் பிரச்சனை உள்ளதா?' },
    ]
  },
  {
    id: 'health',
    title_en: 'Health & Wellness',
    title_ta: 'ஆரோக்கியம்',
    icon: 'medkit',
    color: '#00cec9',
    questions: [
      { en: 'How will my health be this year?', ta: 'இந்த ஆண்டு எனது ஆரோக்கியம் எப்படி இருக்கும்?' },
      { en: 'Will I recover from my illness soon?', ta: 'எனது உடல்நலக் குறைவிலிருந்து நான் விரைவில் குணமடைவேனா?' },
      { en: 'What remedies should I follow for wellness?', ta: 'ஆரோக்கியத்திற்காக நான் என்ன பரிகாரங்களைச் செய்ய வேண்டும்?' },
    ]
  },
  {
    id: 'wealth',
    title_en: 'Wealth & Assets',
    title_ta: 'செல்வம் மற்றும் சொத்துக்கள்',
    icon: 'cash',
    color: '#a29bfe',
    questions: [
      { en: 'When will I buy a new house?', ta: 'நான் எப்போது புதிய வீடு வாங்குவேன்?' },
      { en: 'Will I inherit any ancestral property?', ta: 'எனக்கு பூர்வீக சொத்து கிடைக்குமா?' },
      { en: 'When will I be debt-free?', ta: 'நான் எப்போது கடன் சுமையிலிருந்து விடுபடுவேன்?' },
    ]
  },
  {
    id: 'family',
    title_en: 'Family & Children',
    title_ta: 'குடும்பம் மற்றும் குழந்தைகள்',
    icon: 'people',
    color: '#fab1a0',
    questions: [
      { en: 'When will I have children?', ta: 'எனக்கு எப்போது குழந்தை பாக்கியம் கிடைக்கும்?' },
      { en: 'How will my relationship with my family be?', ta: 'எனது குடும்பத்துடனான உறவு எப்படி இருக்கும்?' },
      { en: 'Will there be any auspicious events in my family?', ta: 'எனது குடும்பத்தில் ஏதேனும் சுப நிகழ்ச்சிகள் நடக்குமா?' },
    ]
  },
  {
    id: 'education',
    title_en: 'Education & Knowledge',
    title_ta: 'கல்வி மற்றும் அறிவு',
    icon: 'book',
    color: '#fdcb6e',
    questions: [
      { en: 'Will I succeed in my higher studies?', ta: 'எனது உயர் கல்வியில் நான் வெற்றி பெறுவேனா?' },
      { en: 'Which field of study is best for me?', ta: 'எனக்கு எந்த கல்வித்துறை சிறந்தது?' },
      { en: 'Will I clear my competitive exams?', ta: 'நான் போட்டித் தேர்வுகளில் வெற்றி பெறுவேனா?' },
    ]
  },
  {
    id: 'travel',
    title_en: 'Travel & Abroad',
    title_ta: 'பயணம் மற்றும் வெளிநாடு',
    icon: 'airplane',
    color: '#55efc4',
    questions: [
      { en: 'When will I go abroad?', ta: 'நான் எப்போது வெளிநாடு செல்வேன்?' },
      { en: 'Will my visa get approved?', ta: 'எனது விசா அங்கீகரிக்கப்படுமா?' },
      { en: 'Is it a good time for long distance travel?', ta: 'தூரப் பயணங்களுக்கு இது சரியான நேரமா?' },
    ]
  }
];

export default function FuturePredictScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(params.cat ? String(params.cat) : QUESTION_CATEGORIES[0].id);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  const currentCategory = QUESTION_CATEGORIES.find(c => c.id === selectedCategory);

  const fetchPrediction = async (question: string, qIdx: number) => {
    setSelectedQuestion(question);
    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('birth_details');
      if (!userDataStr) {
        router.push('/birth-details');
        return;
      }
      const user = JSON.parse(userDataStr);
      
      const url = `${BASE_URL}/astrology/predict?day=${user.day}&month=${user.month}&year=${user.year}&hour=${user.hour}&minute=${user.minute}&category=${selectedCategory}&q_idx=${qIdx}&lang=${language}`;
      const response = await fetch(url);
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Prediction Fetch Error:', error);
      alert('Network error. Please check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.future_predict}</Text>
        </View>

        <View style={styles.categoryScroll}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {QUESTION_CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryBtn, 
                  selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                ]}
              >
                <Ionicons name={cat.icon as any} size={18} color="#fff" />
                <Text style={styles.categoryText}>{language === 'ta' ? cat.title_ta : cat.title_en}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.questionsScroll} contentContainerStyle={styles.questionsList}>
          <Text style={styles.sectionTitle}>
            {language === 'ta' ? 'கேள்வியைத் தேர்ந்தெடுக்கவும்' : 'Select a Question'}
          </Text>
          {currentCategory?.questions.map((q, idx) => (
            <Animated.View key={idx} entering={FadeInDown.delay(idx * 100)}>
              <TouchableOpacity 
                style={styles.questionItem}
                onPress={() => fetchPrediction(language === 'ta' ? q.ta : q.en, idx)}
              >
                <View style={[styles.questionIcon, { backgroundColor: currentCategory.color + '20' }]}>
                  <Ionicons name="help-circle" size={24} color={currentCategory.color} />
                </View>
                <Text style={styles.questionText}>{language === 'ta' ? q.ta : q.en}</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            </Animated.View>
          ))}

          <TouchableOpacity 
            style={styles.aiBanner}
            onPress={() => router.push('/ai')}
          >
            <Ionicons name="sparkles" size={30} color="#f1c40f" />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.aiBannerTitle}>
                {language === 'ta' ? 'உங்களுக்கு சொந்தக் கேள்வி உள்ளதா?' : 'Have a custom question?'}
              </Text>
              <Text style={styles.aiBannerSub}>
                {language === 'ta' ? 'எங்கள் அஸ்ட்ரோ AI உடன் நேரடியாகப் பேசுங்கள்' : 'Talk directly to our Astro AI'}
              </Text>
            </View>
            <View style={styles.aiBtn}>
              <Text style={styles.aiBtnText}>{t.view}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Prediction Result Modal */}
        <Modal
          visible={!!prediction || loading}
          transparent
          animationType="fade"
          onRequestClose={() => setPrediction(null)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInUp} style={styles.modalContent}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6c5ce7" />
                  <Text style={styles.loadingText}>Calculating cosmic influences...</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.resultScroll}>
                  <View style={styles.resultHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: currentCategory?.color }]}>
                      <Ionicons name={currentCategory?.icon as any} size={20} color="#fff" />
                      <Text style={styles.badgeText}>{language === 'ta' ? currentCategory?.title_ta : currentCategory?.title_en}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setPrediction(null)} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color="#aaa" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.resultQuestion}>{selectedQuestion}</Text>
                  
                  <View style={styles.predictionBox}>
                    <Ionicons name="star" size={24} color="#f1c40f" style={styles.starIcon} />
                    <Text style={styles.predictionText}>{prediction?.prediction}</Text>
                  </View>

                  <View style={styles.influenceRow}>
                    <View style={styles.influenceItem}>
                      <Text style={styles.influenceLabel}>Current Dasha</Text>
                      <Text style={styles.influenceValue}>{prediction?.dasha}</Text>
                    </View>
                    <View style={styles.influenceItem}>
                      <Text style={styles.influenceLabel}>Current Bhukti</Text>
                      <Text style={styles.influenceValue}>{prediction?.bhukti}</Text>
                    </View>
                  </View>

                  <View style={styles.explanationSection}>
                    <Text style={styles.sectionTitleSmall}>Expert Insight</Text>
                    <Text style={styles.explanationText}>{prediction?.human_explanation}</Text>
                  </View>

                  <View style={styles.remedyBox}>
                    <Text style={styles.remedyLabel}>Remedy (பரிகாரம்)</Text>
                    <Text style={styles.remedyText}>{prediction?.remedy}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.chatCTA}
                    onPress={() => {
                      setPrediction(null);
                      router.push({
                        pathname: '/astrologers',
                        params: { question: selectedQuestion, charge: '10' }
                      });
                    }}
                  >
                    <Text style={styles.chatCTAText}>Ask more details (₹10/Question)</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                </ScrollView>
              )}
            </Animated.View>
          </View>
        </Modal>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25, gap: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  categoryScroll: { marginBottom: 20 },
  categoryList: { paddingHorizontal: 20, gap: 10 },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  categoryText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  questionsScroll: { flex: 1 },
  questionsList: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  questionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  questionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  questionText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500', lineHeight: 22 },
  aiBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(241, 196, 15, 0.08)', padding: 20, borderRadius: 24, marginTop: 20, borderWidth: 1, borderColor: 'rgba(241, 196, 15, 0.2)' },
  aiBannerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  aiBannerSub: { color: '#aaa', fontSize: 12, marginTop: 4 },
  aiBtn: { backgroundColor: '#f1c40f', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  aiBtnText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#131326', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, height: height * 0.85, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#aaa', marginTop: 15, fontSize: 16 },
  resultScroll: { paddingBottom: 40 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  resultQuestion: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 25, lineHeight: 32 },
  predictionBox: { backgroundColor: 'rgba(108, 92, 231, 0.1)', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(108, 92, 231, 0.3)', marginBottom: 20 },
  starIcon: { marginBottom: 15 },
  predictionText: { color: '#fff', fontSize: 18, lineHeight: 28, fontWeight: '500' },
  influenceRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  influenceItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  influenceLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
  influenceValue: { color: '#00cec9', fontSize: 16, fontWeight: 'bold' },
  explanationSection: { marginBottom: 25 },
  sectionTitleSmall: { color: '#6c5ce7', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  explanationText: { color: '#aaa', fontSize: 15, lineHeight: 24 },
  remedyBox: { backgroundColor: 'rgba(0, 184, 148, 0.1)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0, 184, 148, 0.2)', marginBottom: 30 },
  remedyLabel: { color: '#00b894', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  remedyText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  chatCTA: { backgroundColor: '#6c5ce7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, borderRadius: 20 },
  chatCTAText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
