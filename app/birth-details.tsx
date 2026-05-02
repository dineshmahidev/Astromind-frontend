import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BirthDetailsScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  React.useEffect(() => {
    loadSavedDetails();
  }, []);

  const loadSavedDetails = async () => {
    const saved = await AsyncStorage.getItem('birth_details');
    if (saved) {
      const d = JSON.parse(saved);
      const newDate = new Date();
      newDate.setFullYear(parseInt(d.year));
      newDate.setMonth(parseInt(d.month) - 1);
      newDate.setDate(parseInt(d.day));
      newDate.setHours(parseInt(d.hour));
      newDate.setMinutes(parseInt(d.minute));
      setDate(newDate);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleCalculate = async () => {
    try {
      const formData = {
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        year: date.getFullYear().toString(),
        hour: date.getHours().toString(),
        minute: date.getMinutes().toString(),
        second: '0',
      };

      const queryParams = new URLSearchParams(formData).toString();
      const apiUrl = `http://10.73.33.139:8000/api/astrology/details?${queryParams}`;
      
      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' }
      });
      const json = await response.json();
      
      if (json.success) {
        await AsyncStorage.setItem('user_astrology', JSON.stringify({
          rasi: json.data.rasi,
          nakshatra: json.data.nakshatra,
          padam: json.data.padam,
          rasi_idx: json.data.rasi_idx,
        }));

        await AsyncStorage.setItem('birth_details', JSON.stringify(formData));

        Alert.alert('Astrology Details', `Rasi: ${json.data.rasi}\nNakshatra: ${json.data.nakshatra}\nPadam: ${json.data.padam}`);
        handleBack();
      } else {
        Alert.alert('Error', json.message || 'Failed to calculate');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <CosmicBackground>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Birth Details</ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.sectionLabel}>Select Birth Date & Time</ThemedText>
          
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
            <View style={styles.pickerInfo}>
              <Ionicons name="calendar-outline" size={24} color="#6c5ce7" />
              <View>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{date.toDateString()}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
            <View style={styles.pickerInfo}>
              <Ionicons name="time-outline" size={24} color="#e84393" />
              <View>
                <Text style={styles.label}>Time</Text>
                <Text style={styles.value}>
                  {date.getHours().toString().padStart(2, '0')}:
                  {date.getMinutes().toString().padStart(2, '0')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
            />
          )}

          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Text style={styles.calculateButtonText}>Calculate Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, gap: 15 },
  title: { color: '#fff', fontSize: 28 },
  form: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  sectionLabel: { color: '#6c5ce7', fontWeight: 'bold', marginBottom: 20, fontSize: 16 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  pickerInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  calculateButton: { backgroundColor: '#e84393', borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 30, shadowColor: '#e84393', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  calculateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
