import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { CosmicBackground } from '@/components/CosmicBackground';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function AIScreen() {
  return (
    <CosmicBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Astro AI</ThemedText>
          <ThemedText style={styles.subtitle}>Ask anything about your future</ThemedText>
        </View>

        <Animated.View entering={FadeIn} style={styles.chatContainer}>
          <View style={styles.messageBox}>
            <ThemedText style={styles.botText}>Hello! I am your Astro AI. Ask me about your Rasi, Nakshatra, or daily predictions.</ThemedText>
          </View>
        </Animated.View>

        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              placeholder="Ask me something..." 
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.sendButton}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.suggestions}>
          <TouchableOpacity style={styles.suggestionItem}>
            <ThemedText style={styles.suggestionText}>How is my day today?</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionItem}>
            <ThemedText style={styles.suggestionText}>Tell me about Pooratathi star</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    flexGrow: 1,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 28,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 5,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 20,
  },
  messageBox: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.4)',
    maxWidth: '85%',
  },
  botText: {
    color: '#fff',
    lineHeight: 22,
  },
  inputArea: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 5,
    paddingLeft: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    color: '#fff',
    height: 45,
  },
  sendButton: {
    backgroundColor: '#6c5ce7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionText: {
    color: '#aaa',
    fontSize: 12,
  },
});
