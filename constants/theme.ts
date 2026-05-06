/**
 * Aegis Call Design System
 * Colors derived from Figma design reference
 */

import { Platform } from 'react-native';

export const Colors = {
  // Brand colors
  primary: '#313A5E',
  primaryDark: '#1E2440',
  primaryLight: '#4A5580',
  accent: '#0F4777',
  emergency: '#F07774',
  emergencyDark: '#D4504D',
  emergencyLight: '#F5A3A1',

  // Neutrals
  white: '#FFFFFF',
  background: '#F5F5F5',
  card: '#FFFFFF',
  border: '#E8E8E8',
  gray: '#8B8B8B',
  grayLight: '#C4C4C4',
  grayDark: '#555555',
  text: '#1A1A2E',
  textSecondary: '#8B8B8B',
  textLight: '#FFFFFF',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  danger: '#F44336',

  // Themes
  light: {
    text: '#1A1A2E',
    background: '#F5F5F5',
    card: '#FFFFFF',
    tint: '#313A5E',
    icon: '#8B8B8B',
    tabIconDefault: '#8B8B8B',
    tabIconSelected: '#313A5E',
    border: '#E8E8E8',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0D1117',
    card: '#161B22',
    tint: '#F07774',
    icon: '#8B949E',
    tabIconDefault: '#8B949E',
    tabIconSelected: '#F07774',
    border: '#30363D',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  h1: 32,
  h2: 28,
  h3: 24,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter',
    sansBold: 'Inter-Bold',
    sansMedium: 'Inter-Medium',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter_400Regular',
    sansBold: 'Inter_700Bold',
    sansMedium: 'Inter_500Medium',
    mono: 'monospace',
  },
});

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};
