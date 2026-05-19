// Lightweight in-app chat notification banner.
// Listens for new `report_messages` and `chat_messages` (community room)
// realtime inserts and pops a top banner with sender + preview. Hidden when
// the user is currently on any chat screen so it doesn't double up.

import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { supabase } from '../../services/supabase';

const NAVY = '#003B71';

type BannerData = {
  id: string;
  title: string;
  body: string;
  icon: 'chatbubble' | 'people';
  // Tap target. 'community' opens /chat. 'report' opens the per-report chat
  // for the current user role (staff → petugas chat; user → user chat).
  kind: 'community' | 'report';
  reportId?: string;
  senderName?: string;
};

export function ChatNotificationOverlay() {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<BannerData | null>(null);
  const slide = useRef(new Animated.Value(-140)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep pathname in a ref so we don't resubscribe on every navigation.
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => { pathRef.current = pathname; }, [pathname]);

  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  const showBanner = (data: BannerData) => {
    setBanner(data);
    Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(slide, { toValue: -140, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true })
        .start(() => setBanner(null));
    }, 3200);
  };

  useEffect(() => {
    if (!user) return;

    // Don't show banner when the user is already viewing any chat screen.
    const onChatScreen = () =>
      pathRef.current === '/chat'
      || pathRef.current === '/report-chat'
      || pathRef.current?.includes('(petugas)/chat')
      || pathRef.current?.endsWith('/chat');

    const ch1 = supabase
      .channel(`global-report-msgs-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_messages' }, async (payload) => {
        const row = payload.new as { id: string; report_id: string; sender_id: string; sender_role: string; message: string | null; attachment_type: string | null };
        if (row.sender_id === userIdRef.current) return;
        if (onChatScreen()) return;

        // Look up sender name (best-effort; falls back to role label).
        let title = row.sender_role === 'petugas' ? 'Petugas'
                  : row.sender_role === 'admin' ? 'Admin'
                  : 'Pelapor';
        try {
          const { data } = await supabase.from('profiles').select('name').eq('id', row.sender_id).maybeSingle();
          if (data?.name) title = data.name;
        } catch {}

        const body = row.message
          ? row.message
          : row.attachment_type === 'image' ? '📷 Mengirim foto'
          : row.attachment_type === 'audio' ? '🎤 Pesan suara'
          : 'Pesan baru';

        showBanner({
          id: row.id,
          title, body,
          icon: 'chatbubble',
          kind: 'report',
          reportId: row.report_id,
          senderName: title,
        });
      })
      .subscribe();

    const ch2 = supabase
      .channel(`global-chat-msgs-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const row = payload.new as { id: string; user_id: string; user_name: string; content: string | null; attachment_type: string | null };
        if (row.user_id === userIdRef.current) return;
        if (onChatScreen()) return;

        const body = row.content
          ? row.content
          : row.attachment_type === 'image' ? '📷 Mengirim foto'
          : row.attachment_type === 'audio' ? '🎤 Pesan suara'
          : 'Pesan baru';

        showBanner({
          id: row.id,
          title: row.user_name,
          body,
          icon: 'people',
          kind: 'community',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!banner) return null;

  const dismissBanner = (cb?: () => void) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(slide, { toValue: -140, duration: 200, useNativeDriver: true })
      .start(() => { setBanner(null); cb?.(); });
  };

  const handleTap = () => {
    const current = banner;
    dismissBanner(() => {
      if (!current) return;
      if (current.kind === 'community') {
        router.push('/chat' as any);
        return;
      }
      if (current.kind === 'report' && current.reportId) {
        const role = user?.role;
        if (role === 'petugas' || role === 'admin') {
          // Petugas chat expects a stringified report object. Pass minimum
          // fields; the screen will fall back gracefully for the missing ones.
          router.push({
            pathname: '/(petugas)/chat' as any,
            params: {
              reportJson: JSON.stringify({
                id: current.reportId,
                userName: current.senderName ?? 'Pelapor',
                location: { address: '' },
                type: 'ambulance',
              }),
            },
          });
        } else {
          router.push({
            pathname: '/report-chat' as any,
            params: { reportId: current.reportId, title: '' },
          });
        }
      }
    });
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingTop: insets.top + 8, transform: [{ translateY: slide }] },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={handleTap}>
        <View style={styles.iconWrap}>
          <Ionicons name={banner.icon === 'people' ? 'people' : 'chatbubble-ellipses'} size={18} color="#fff" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>{banner.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{banner.body}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: 14,
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 13, fontWeight: '800' },
  body:  { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500', marginTop: 2 },
});
