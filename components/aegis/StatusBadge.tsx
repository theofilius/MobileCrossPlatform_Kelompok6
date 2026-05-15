import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Report } from '../../services/reportService';

const COLOR: Record<Report['status'], string> = {
  pending: '#F97316',
  responded: '#3B82F6',
  resolved: '#10B981',
};

const ICON: Record<Report['status'], string> = {
  pending: 'time-outline',
  responded: 'shield-checkmark-outline',
  resolved: 'checkmark-circle-outline',
};

export type StatusBadgeProps = {
  status: Report['status'];
  label: string;
  size?: 'sm' | 'md';
  withIcon?: boolean;
  filled?: boolean; // solid bg vs tinted
};

export function StatusBadge({ status, label, size = 'sm', withIcon = false, filled = false }: StatusBadgeProps) {
  const color = COLOR[status];
  const bg = filled ? color : color + '18';
  const textColor = filled ? '#FFFFFF' : color;

  const padH = size === 'sm' ? 8 : 10;
  const padV = size === 'sm' ? 3 : 5;
  const fontSize = size === 'sm' ? 10 : 11;
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: padH, paddingVertical: padV }]}>
      {withIcon && <Ionicons name={ICON[status] as any} size={iconSize} color={textColor} />}
      <Text style={[styles.label, { color: textColor, fontSize }]}>{label}</Text>
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
