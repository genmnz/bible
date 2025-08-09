import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeMode } from '../context/ThemeContext';

// Central hook to create themed styles across screens
export const useThemedStyles = (factory) => {
  const { colors } = useThemeMode();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
};
