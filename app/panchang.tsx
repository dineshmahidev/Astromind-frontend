import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

export default function PanchangScreen() {
  const router = useRouter();

  const panchangData = [
    { label: 'Tithi', value: 'Ekadashi', icon: 'moon' },
    { label: 'Nakshatra', value: 'Pooratathi', icon: 'star' },
    { label: 'Yoga', value: 'Vriddhi', icon: 'infinite' },
    { label: 'Karana', value: 'Bava', icon: 'water' },
    { label: 'Vara', value: 'Velli (Friday)', icon: 'calendar' },
  ];

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
          <ThemedText type="title" style={styles.title}>Daily Panchang</ThemedText>
        </View>

        <View style={styles.grid}>
          {panchangData.map((item, index) => (
            <View key={index} style={styles.item}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon as any} size={24} color="#00cec9" />
              </View>
              <View>
                <ThemedText style={styles.label}>{item.label}</ThemedText>
                <ThemedText style={styles.value}>{item.value}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.timings}>
          <ThemedText style={styles.sectionTitle}>Auspicious Timings</ThemedText>
          <View style={styles.timingCard}>
            <ThemedText style={styles.timingLabel}>Abhijit Muhurta</ThemedText>
            <ThemedText style={styles.timingValue}>11:54 AM - 12:46 PM</ThemedText>
          </View>
          <ThemedText style={[styles.sectionTitle, { color: '#ff7675', marginTop: 20 }]}>Inauspicious Timings</ThemedText>
          <View style={[styles.timingCard, { borderColor: 'rgba(255, 118, 117, 0.2)' }]}>
            <ThemedText style={styles.timingLabel}>Rahu Kaal</ThemedText>
            <ThemedText style={styles.timingValue}>10:42 AM - 12:19 PM</ThemedText>
          </View>
        </View>
      </ScrollView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  title: { color: '#fff', fontSize: 28 },
  grid: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 25, padding: 20, gap: 20 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0, 206, 201, 0.1)', justifyContent: 'center', alignItems: 'center' },
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  timings: { marginTop: 30 },
  sectionTitle: { color: '#00cec9', fontWeight: 'bold', marginBottom: 15, fontSize: 18 },
  timingCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(0, 206, 201, 0.2)', marginBottom: 10 },
  timingLabel: { color: '#aaa', fontSize: 14 },
  timingValue: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 5 },
});
