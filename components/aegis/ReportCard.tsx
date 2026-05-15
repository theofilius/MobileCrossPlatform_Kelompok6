import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EMERGENCY_COLORS, Report } from '../../services/reportService';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';

export type ReportCardProps = {
  report: Report;
  typeLabel: string;
  statusLabel: string;
  timeText: string;
  onPress?: () => void;
};

export function ReportCard({ report, typeLabel, statusLabel, timeText, onPress }: ReportCardProps) {
  const color = EMERGENCY_COLORS[report.type];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} disabled={!onPress}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TypeBadge type={report.type} label={typeLabel} />
          <StatusBadge status={report.status} label={statusLabel} />
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {report.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
            <Text style={styles.address} numberOfLines={1}>{report.address}</Text>
          </View>
          <Text style={styles.time}>{timeText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accent: { width: 4 },
  content: { flex: 1, padding: 14, gap: 6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  description: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  address: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginLeft: 8,
  },
});
