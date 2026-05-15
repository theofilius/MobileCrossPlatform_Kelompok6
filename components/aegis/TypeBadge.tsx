import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EMERGENCY_COLORS, EmergencyType } from '../../services/reportService';

const ICON: Record<EmergencyType, string> = {
  fire: 'fire',
  accident: 'car-crash',
  crime: 'shield-alert',
  disaster: 'weather-lightning-rainy',
  medical: 'medical-bag',
  other: 'alert-circle',
};

export type TypeBadgeProps = {
  type: EmergencyType;
  label: string;
  size?: 'sm' | 'md';
  withIcon?: boolean;
};

export function TypeBadge({ type, label, size = 'sm', withIcon = true }: TypeBadgeProps) {
  const color = EMERGENCY_COLORS[type];

  const padH = size === 'sm' ? 8 : 10;
  const padV = size === 'sm' ? 3 : 5;
  const fontSize = size === 'sm' ? 11 : 13;
  const iconSize = size === 'sm' ? 13 : 15;

  return (
    <View style={[styles.badge, { backgroundColor: color + '18', paddingHorizontal: padH, paddingVertical: padV }]}>
      {withIcon && <MaterialCommunityIcons name={ICON[type] as any} size={iconSize} color={color} />}
      <Text style={[styles.label, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
  },
});
