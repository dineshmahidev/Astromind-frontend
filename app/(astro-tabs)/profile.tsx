import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { translations } from '@/constants/translations';

export default function AstroProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    loadProfile();
    loadLang();
  }, []);

  const loadLang = async () => {
    const lang = await AsyncStorage.getItem('app_lang');
    if (lang) setCurrentLang(lang);
  };

  const changeLang = async (lang: string) => {
    setCurrentLang(lang);
    await AsyncStorage.setItem('app_lang', lang);
    // In a real app, you might want to use a context/state manager to update the entire app
    Alert.alert('Success', 'Language updated successfully!');
  };

  const t = translations[currentLang] || translations.en;

  const loadProfile = async () => {
    try {
        const userData = await AsyncStorage.getItem('user_data');
        if (!userData) return;
        const parsed = JSON.parse(userData);
        
        const customUrl = await AsyncStorage.getItem('custom_server_url');
        const baseUrl = customUrl ? (customUrl.endsWith('/api') ? customUrl : `${customUrl}/api`) : 'https://astro.90skalyanam.com/api';
        
        const res = await fetch(`${baseUrl}/astrologer/dashboard?user_id=${parsed.id}`);
        const json = await res.json();
        if (json.success && json.expert) {
            setUser({ ...parsed, ...json.expert });
        } else {
            setUser(parsed);
        }
    } catch (e) {
        console.error('Profile Load Error:', e);
    } finally {
        setLoading(false);
    }
  };

  const updateInfo = async () => {
    setSaving(true);
    try {
        const customUrl = await AsyncStorage.getItem('custom_server_url');
        const baseUrl = customUrl ? (customUrl.endsWith('/api') ? customUrl : `${customUrl}/api`) : 'https://astro.90skalyanam.com/api';

        const res = await fetch(`${baseUrl}/astrologer/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: user.id, 
                ...user
            })
        });
        const json = await res.json();
        if (json.success) {
            Alert.alert('Success', 'Profile updated successfully!');
            await AsyncStorage.setItem('user_data', JSON.stringify(user));
            setIsEditing(false);
        }
    } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not save changes.');
    } finally {
        setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t.logout, t.logout_confirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.logout, style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/auth/login');
      }}
    ]);
  };

  if (loading || !user) return <ActivityIndicator style={{ flex: 1, marginTop: 100 }} />;

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? t.save : t.profile}</Text>
          <TouchableOpacity onPress={isEditing ? () => setIsEditing(false) : handleLogout} style={styles.logoutBtn}>
            <Ionicons name={isEditing ? "close" : "log-out-outline"} size={20} color={isEditing ? "#fff" : "#ff7675"} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.profileCard}>
            <TouchableOpacity style={styles.avatarWrapper}>
                <Image 
                    source={{ uri: user.profile_image || 'https://i.pravatar.cc/100?u='+user.id }} 
                    style={styles.avatar} 
                />
                {isEditing && <View style={styles.editBadge}><Ionicons name="camera" size={14} color="#fff" /></View>}
            </TouchableOpacity>
            {!isEditing && (
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.viewName}>{user.name}</Text>
                    <Text style={styles.viewSpec}>{user.specialization}</Text>
                </View>
            )}
            <Text style={styles.email}>{user.email}</Text>
          </View>

          {isEditing ? (
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput 
                        style={styles.input} 
                        value={user.name} 
                        onChangeText={(val) => setUser({ ...user, name: val })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Specialization</Text>
                    <TextInput 
                        style={styles.input} 
                        value={user.specialization} 
                        onChangeText={(val) => setUser({ ...user, specialization: val })}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Experience (Yrs)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={String(user.experience || '')} 
                            keyboardType="numeric"
                            onChangeText={(val) => setUser({ ...user, experience: val })}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                        <Text style={styles.label}>Price/Min (₹)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={String(user.price_per_minute || '')} 
                            keyboardType="numeric"
                            onChangeText={(val) => setUser({ ...user, price_per_minute: val })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>City</Text>
                    <TextInput 
                        style={styles.input} 
                        value={user.city} 
                        onChangeText={(val) => setUser({ ...user, city: val })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Biography</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea]} 
                        value={user.bio} 
                        multiline
                        onChangeText={(val) => setUser({ ...user, bio: val })}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                    onPress={updateInfo}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
                </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewContent}>
                {/* LANGUAGE TOGGLE */}
                <View style={styles.languageSection}>
                    <Text style={styles.sectionLabel}>{t.language}</Text>
                    <View style={styles.langGrid}>
                        {[
                            { id: 'en', label: 'English' },
                            { id: 'ta', label: 'தமிழ்' },
                            { id: 'hi', label: 'हिन्दी' }
                        ].map(lang => (
                            <TouchableOpacity 
                                key={lang.id}
                                style={[styles.langBtn, currentLang === lang.id && styles.langBtnActive]}
                                onPress={() => changeLang(lang.id)}
                            >
                                <Text style={[styles.langBtnText, currentLang === lang.id && styles.langBtnTextActive]}>{lang.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* WALLET CARD */}
                <TouchableOpacity 
                    style={styles.walletCard}
                    onPress={() => router.push('/astrologer/wallet')}
                >
                    <View>
                        <Text style={styles.walletLabel}>{t.balance}</Text>
                        <Text style={styles.walletAmount}>₹{user.wallet_balance || 0}</Text>
                    </View>
                    <View style={styles.walletAction}>
                        <Text style={styles.walletActionText}>Withdraw</Text>
                        <Ionicons name="chevron-forward" size={16} color="#6c5ce7" />
                    </View>
                </TouchableOpacity>

                <View style={styles.statRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{user.experience || 0}Y+</Text>
                        <Text style={styles.statLab}>Experience</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>₹{user.price_per_minute || 0}</Text>
                        <Text style={styles.statLab}>Rate/Min</Text>
                    </View>
                </View>

                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailText}>{user.city || 'Not specified'}</Text>
                </View>

                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Bio</Text>
                    <Text style={styles.detailText}>{user.bio || 'No bio provided yet.'}</Text>
                </View>

                <TouchableOpacity 
                    style={[styles.editBtn, { backgroundColor: 'rgba(255,215,0,0.1)', borderColor: '#ffd700', borderWidth: 1, marginBottom: 12 }]} 
                    onPress={() => router.push({
                        pathname: '/astrologer/detail',
                        params: {
                            id: user.id,
                            name: user.name,
                            speciality: user.specialization,
                            experience: user.experience,
                            rating: user.rating || '4.9',
                            price: user.price_per_minute,
                            avatar: user.profile_image,
                            languages: user.languages || 'English, Tamil',
                            bio: user.bio,
                            city: user.city
                        }
                    })}
                >
                    <Ionicons name="eye-outline" size={18} color="#ffd700" />
                    <Text style={[styles.editBtnText, { color: '#ffd700' }]}>{t.view_public}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={styles.editBtnText}>Edit Professional Profile</Text>
                </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  logoutText: { color: '#ff7675', fontWeight: 'bold' },
  profileCard: { alignItems: 'center', marginBottom: 40 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#6c5ce7' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#6c5ce7', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0d0d1f' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  email: { color: '#888', fontSize: 14, marginTop: 5 },
  walletCard: { backgroundColor: 'rgba(108,92,231,0.1)', borderRadius: 24, padding: 25, marginBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(108,92,231,0.2)' },
  walletLabel: { color: '#888', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  walletAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  walletAction: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 5 },
  walletActionText: { color: '#6c5ce7', fontWeight: 'bold', fontSize: 13 },
  viewName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  viewSpec: { color: '#6c5ce7', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  viewContent: { marginTop: 20 },
  statRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statBox: { flex: 1, backgroundColor: 'rgba(108,92,231,0.05)', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(108,92,231,0.1)' },
  statVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLab: { color: '#888', fontSize: 11, marginTop: 4 },
  detailBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  detailLabel: { color: '#444', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  detailText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#6c5ce7', borderRadius: 20, padding: 18, marginTop: 10 },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  form: { marginTop: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#666', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 15, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  row: { flexDirection: 'row' },
  textArea: { height: 120, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#6c5ce7', borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 20, shadowColor: '#6c5ce7', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  languageSection: { marginBottom: 25 },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  langGrid: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', paddingVertical: 12, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  langBtnActive: { backgroundColor: 'rgba(108,92,231,0.1)', borderColor: '#6c5ce7' },
  langBtnText: { color: '#888', fontSize: 13, fontWeight: 'bold' },
  langBtnTextActive: { color: '#fff' },
});
