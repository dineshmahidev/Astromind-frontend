import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '@/constants/translations';

interface LanguageContextType {
  language: Language;
  t: typeof translations['en'];
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const saved = await AsyncStorage.getItem('app_lang');
    if (saved) setLangState(saved as Language);
  };

  const setLanguage = async (newLang: Language) => {
    setLangState(newLang);
    await AsyncStorage.setItem('app_lang', newLang);
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
