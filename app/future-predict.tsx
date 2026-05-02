import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const QUESTION_CATEGORIES = [
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
    id: 'travel',
    title_en: 'Travel & Abroad',
    title_ta: 'பயணம் மற்றும் வெளிநாடு',
    icon: 'airplane',
    color: '#fab1a0',
    questions: [
      { en: 'When will I go abroad?', ta: 'நான் எப்போது வெளிநாடு செல்வேன்?' },
      { en: 'Will my visa get approved?', ta: 'எனது விசா அங்கீகரிக்கப்படுமா?' },
      { en: 'Is it a good time for long distance travel?', ta: 'தூரப் பயணங்களுக்கு இது சரியான நேரமா?' },
    ]
  }
];

export default function FuturePredictScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(QUESTION_CATEGORIES[0].id);

  const currentCategory = QUESTION_CATEGORIES.find(c => c.id === selectedCategory);

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
                onPress={() => router.push({
                  pathname: '/astrologer/chat',
                  params: { 
                    mode: 'chat',
                    initialMessage: language === 'ta' ? q.ta : q.en
                  }
                })}
              >
                <View style={[styles.questionIcon, { backgroundColor: currentCategory.color + '20' }]}>
                  <Ionicons name="help-circle" size={24} color={currentCategory.color} />
                </View>
                <Text style={styles.questionText}>{language === 'ta' ? q.ta : q.en}</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            </Animated.View>
          ))}

          <View style={styles.aiBanner}>
            <Ionicons name="sparkles" size={30} color="#f1c40f" />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.aiBannerTitle}>
                {language === 'ta' ? 'உங்களுக்கு சொந்தக் கேள்வி உள்ளதா?' : 'Have a custom question?'}
              </Text>
              <Text style={styles.aiBannerSub}>
                {language === 'ta' ? 'எங்கள் அஸ்ட்ரோ AI உடன் நேரடியாகப் பேசுங்கள்' : 'Talk directly to our Astro AI'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.aiBtn}
              onPress={() => router.push('/astrologer/chat')}
            >
              <Text style={styles.aiBtnText}>{t.view}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
});
