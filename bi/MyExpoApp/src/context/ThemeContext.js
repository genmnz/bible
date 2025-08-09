import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const lightColors = {
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#1c1c1e',
  subtext: '#6b7280',
  border: '#e5e7eb',
  primary: '#5095ff',
  success: '#4CAF50',
  danger: '#FF6B6B',
};

const darkColors = {
  background: '#0b0b0f',
  card: '#15151b',
  text: '#f2f2f7',
  subtext: '#a1a1aa',
  border: '#27272a',
  primary: '#7fb3ff',
  success: '#6DD17C',
  danger: '#FF8A8A',
};

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState('system'); // 'system' | 'light' | 'dark'
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('themeMode');
        if (stored) setModeState(stored);
      } catch (e) {
        console.error("Failed to load theme from storage", e);
      } finally {
        setLoading(false);
      }
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || 'light');
    });
    return () => sub.remove();
  }, []);

  const setMode = async (nextMode) => {
    setModeState(nextMode);
    try {
      await AsyncStorage.setItem('themeMode', nextMode);
    } catch {}
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, colors, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
