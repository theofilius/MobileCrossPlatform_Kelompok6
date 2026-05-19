import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { supabase } from '../../services/supabase';

const NAVY = '#003B71';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const SUB = '#94A3B8';
const BG_TOP = '#D2E7FA';
const BG_BOTTOM = '#FFFFFF';
const CARD = '#FFFFFF';

type NotifType = 'sos' | 'call' | 'contact' | 'security' | 'permission';

type NotifRow = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

type Notif = Omit<NotifRow, 'created_at'> & { createdAt: Date };

const TYPE_META: Record<NotifType, { icon: any; iconSet: 'ion' | 'mat'; color: string; bg: string }> = {
  sos:        { icon: 'alert-octagon',         iconSet: 'mat', color: '#DC2626', bg: '#FEE2E2' },
  call:       { icon: 'phone-incoming',        iconSet: 'mat', color: '#1D4ED8', bg: '#DBEAFE' },
  contact:    { icon: 'account-multiple',      iconSet: 'mat', color: '#15803D', bg: '#DCFCE7' },
  security:   { icon: 'shield-key',            iconSet: 'mat', color: '#7C3AED', bg: '#F5F3FF' },
  permission: { icon: 'shield-alert-outline',  iconSet: 'mat', color: '#B45309', bg: '#FEF3C7' },
};

function TypeIcon({ type }: { type: NotifType }) {
  const meta = TYPE_META[type];
  return meta.iconSet === 'mat'
    ? <MaterialCommunityIcons name={meta.icon} size={18} color={meta.color} />
    : <Ionicons name={meta.icon} size={18} color={meta.color} />;
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'Baru saja';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function rowToNotif(row: NotifRow): Notif {
  return { ...row, createdAt: new Date(row.created_at) };
}

export default function NotifikasiScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, body, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return;
    setItems((data ?? []).map(rowToNotif as any));
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAll().finally(() => { if (mounted) setLoading(false); });

    if (!user?.id) return;
    const channel = supabase
      .channel(`notif-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchAll(),
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unreadCount = items.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_TOP} translucent />
      <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={StyleSheet.absoluteFillObject} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifikasi</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} belum dibaca</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} hitSlop={8}>
            <Text style={styles.markAllText}>Tandai dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={NAVY} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={32} color={NAVY} />
          </View>
          <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
          <Text style={styles.emptySub}>
            Notifikasi tugas baru, update status, dan pengumuman admin akan muncul di sini.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type] ?? TYPE_META.security;
            return (
              <TouchableOpacity
                style={[styles.card, !item.read && styles.cardUnread]}
                activeOpacity={0.85}
                onPress={() => !item.read && handleMarkRead(item.id)}
              >
                <View style={[styles.cardIcon, { backgroundColor: meta.bg }]}>
                  <TypeIcon type={item.type} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>
                  <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_BOTTOM },

  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: TEXT, letterSpacing: -0.3 },
  headerSub:   { fontSize: 11.5, color: MUTED, fontWeight: '600', marginTop: 1 },
  markAllText: { fontSize: 12, color: NAVY, fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', shadowColor: NAVY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  emptySub:   { fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 18 },

  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardUnread: { borderColor: NAVY + '30', backgroundColor: '#F8FAFD' },
  cardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: TEXT },
  cardBody:  { fontSize: 12.5, color: MUTED, lineHeight: 18 },
  cardTime:  { fontSize: 10.5, color: SUB, fontWeight: '600', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: NAVY },
});
