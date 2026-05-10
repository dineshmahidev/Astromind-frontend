import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL as DEFAULT_BASE_URL } from '@/constants/Config';

export default function AstroWallet() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
        const userData = await AsyncStorage.getItem('user_data');
        if (!userData) return;
        const user = JSON.parse(userData);
        
        const savedUrl = await AsyncStorage.getItem('custom_server_url');
        const baseUrl = savedUrl ? (savedUrl.endsWith('/api') ? savedUrl : `${savedUrl}/api`) : DEFAULT_BASE_URL;
        
        const res = await fetch(`${baseUrl}/astrologer/wallet?user_id=${user.id}`);
        const json = await res.json();
        if (json.success) {
            setBalance(json.balance);
            setTransactions(json.transactions);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
    }
    if (amt > balance) {
        Alert.alert('Error', 'Insufficient balance');
        return;
    }

    setRequesting(true);
    try {
        const userData = await AsyncStorage.getItem('user_data');
        const user = JSON.parse(userData!);
        
        const savedUrl = await AsyncStorage.getItem('custom_server_url');
        const baseUrl = savedUrl ? (savedUrl.endsWith('/api') ? savedUrl : `${savedUrl}/api`) : DEFAULT_BASE_URL;
        
        const res = await fetch(`${baseUrl}/astrologer/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, amount: amt })
        });
        const json = await res.json();
        if (json.success) {
            Alert.alert('Success', 'Withdrawal request submitted! It will be processed shortly.');
            setWithdrawAmount('');
            fetchWallet();
        } else {
            Alert.alert('Error', json.message);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setRequesting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, marginTop: 100 }} />;

  return (
    <CosmicBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Earnings & Wallet</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Payout</Text>
            <Text style={styles.balanceAmt}>₹{balance}</Text>
            <View style={styles.commissionTag}>
                <Text style={styles.commissionText}>Your share: 80% per session</Text>
            </View>
          </View>

          <View style={styles.withdrawSection}>
            <Text style={styles.sectionTitle}>Request Withdrawal</Text>
            <View style={styles.inputRow}>
                <TextInput 
                    style={styles.input}
                    placeholder="Enter amount to withdraw"
                    placeholderTextColor="#444"
                    keyboardType="numeric"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                />
                <TouchableOpacity 
                    style={[styles.withdrawBtn, requesting && { opacity: 0.7 }]} 
                    onPress={handleWithdraw}
                    disabled={requesting}
                >
                    {requesting ? <ActivityIndicator color="#fff" /> : <Text style={styles.withdrawBtnText}>Withdraw</Text>}
                </TouchableOpacity>
            </View>
          </View>

          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions.map((tx: any) => (
                <View key={tx.id} style={styles.txItem}>
                    <View style={styles.txLeft}>
                        <View style={[styles.iconBox, { backgroundColor: tx.type === 'credit' ? 'rgba(0,206,201,0.1)' : 'rgba(255,118,117,0.1)' }]}>
                            <Ionicons 
                                name={tx.type === 'credit' ? "arrow-down" : "arrow-up"} 
                                size={20} 
                                color={tx.type === 'credit' ? "#00cec9" : "#ff7675"} 
                            />
                        </View>
                        <View>
                            <Text style={styles.txDesc}>{tx.description}</Text>
                            <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.txAmt, { color: tx.type === 'credit' ? '#00cec9' : '#ff7675' }]}>
                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                        </Text>
                        <Text style={[styles.txStatus, { color: tx.status === 'completed' ? '#00cec9' : '#fdcb6e' }]}>
                            {tx.status}
                        </Text>
                    </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  balanceCard: { backgroundColor: 'rgba(108,92,231,0.1)', borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(108,92,231,0.2)', marginBottom: 30 },
  balanceLabel: { color: '#888', fontSize: 13, textTransform: 'uppercase', fontWeight: 'bold' },
  balanceAmt: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginVertical: 10 },
  commissionTag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 12 },
  commissionText: { color: '#6c5ce7', fontSize: 12, fontWeight: 'bold' },

  withdrawSection: { marginBottom: 30 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 15, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  withdrawBtn: { backgroundColor: '#6c5ce7', borderRadius: 15, paddingHorizontal: 25, justifyContent: 'center' },
  withdrawBtnText: { color: '#fff', fontWeight: 'bold' },

  historySection: { paddingBottom: 50 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  txDesc: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  txDate: { color: '#555', fontSize: 11, marginTop: 2 },
  txAmt: { fontSize: 16, fontWeight: 'bold' },
  txStatus: { fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold', marginTop: 4 }
});
