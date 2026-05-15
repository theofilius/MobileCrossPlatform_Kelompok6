import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';
import {
  Notification,
  NotifType,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  subscribe,
} from '../services/notificationsService';

const TYPE_META: Record<NotifType, { icon: string; iconSet: 'ion' | 'mat'; color: string; bg: string }> = {
  sos: { icon: 'alert-octagon', iconSet: 'mat', color: '#DC2626', bg: '#FEF2F2' },
  call: { icon: 'phone-incoming', iconSet: 'mat', color: '#0C4F8D', bg: '#EFF6FF' },
  contact: { icon: 'account-multiple', iconSet: 'mat', color: '#059669', bg: '#F0FDF4' },
  security: { icon: 'shield-key', iconSet: 'mat', color: '#7C3AED', bg: '#F5F3FF' },
  permission: { icon: 'shield-alert-outline', iconSet: 'mat', color: '#EA580C', bg: '#FFF7ED' },
};

function formatTimeAgo(date: Date, locale: string): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return locale === 'id' ? 'Baru saja' : 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === 'id' ? `${minutes} mnt lalu` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'id' ? `${hours} jam lalu` : `${hours}h ago`;
  return locale === 'id' ? `${Math.floor(hours / 24)} hari lalu` : `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [items, setItems] = useState<Notification[]>(getNotifications());
  const [unread, setUnread] = useState<number>(getUnreadCount());

  useEffect(() => {
    return subscribe(() => {
      setItems(getNotifications());
      setUnread(getUnreadCount());
    });
  }, []);

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{t('notif_title')}</Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unread} {t('notif_unread')}</Text>
              </View>
            )}
          </View>
          {unread > 0 ? (
            <TouchableOpacity style={styles.readAllBtn} onPress={markAllRead}>
              <Ionicons name="checkmark-done" size={20} color="#003B71" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type];
            return (
              <TouchableOpacity
                style={[styles.card, !item.read && styles.cardUnread]}
                onPress={() => markRead(item.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                  {meta.iconSet === 'mat' ? (
                    <MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.color} />
                  ) : (
                    <Ionicons name={meta.icon as any} size={22} color={meta.color} />
                  )}
                </View>

                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    {!item.read && <View style={styles.dot} />}
                  </View>
                  <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.time}>{formatTimeAgo(item.createdAt, language)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="bell-off-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>{t('notif_empty')}</Text>
              <Text style={styles.emptySub}>{t('notif_empty_sub')}</Text>
            </View>
          }
        />

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#003B71' },
  unreadBadge: {
    backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, marginTop: 3,
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  readAllBtn: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF',
  },

  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#0C4F8D' },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0C4F8D' },
  body: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  time: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginTop: 4 },
  emptySub: { fontSize: 13, color: '#D1D5DB', textAlign: 'center', paddingHorizontal: 32 },
});
