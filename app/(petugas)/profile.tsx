import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
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
import { AuthContext } from '../context/AuthContext';
import { getPetugasStats, subscribeToReports, type PetugasStats } from '../../services/reportService';
import { useDialog } from '../../components/aegis/Dialog';

// Figma palette
const NAVY = '#003B71';
const NAVY_DEEP = '#0A2540';
const TEXT = '#0A1929';
const MUTED = '#5A6B82';
const SUB = '#94A3B8';
const LAVENDER_BG = '#E8E2FF';
const LAVENDER_FG = '#3B2F8C';
const BG_TOP = '#D2E7FA';
const BG_BOTTOM = '#FFFFFF';
const CARD = '#FFFFFF';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useContext(AuthContext);
  const [stats, setStats] = useState<PetugasStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const dialog = useDialog();

  // Petugas profile is read-only — name/email/photo are provisioned by admin.
  const photo = user?.photoUri || null;

  const isAdmin = user?.role === 'admin';
  const roleLabel = isAdmin ? 'Administrator' : 'Petugas Lapangan';
  const roleColor = isAdmin ? LAVENDER_FG : NAVY;
  const roleBg    = isAdmin ? LAVENDER_BG : '#DBEAFE';

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const refresh = (initial = false) => {
      if (initial) setLoadingStats(true);
      getPetugasStats(user.id)
        .then(s => { if (mounted) setStats(s); })
        .catch(() => { if (mounted) setStats({ total: 0, active: 0, resolved: 0 }); })
        .finally(() => { if (mounted && initial) setLoadingStats(false); });
    };

    refresh(true);
    // Refetch on any report change (status update, new report assigned, etc).
    const unsub = subscribeToReports(() => refresh(false));
    return () => { mounted = false; unsub(); };
  }, [user?.id]);

  const handleLogout = () => {
    dialog.show({
      type: 'warning',
      title: 'Keluar',
      body: 'Yakin mau logout dari akun ini?',
      primaryText: 'Logout',
      secondaryText: 'Batal',
      onPrimary: () => signOut()
    });
  };

  const initials = (user?.name || 'P').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_TOP} translucent />

      <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>

        {/* Page title (matches Figma "Emergencies" style) */}
        <Text style={styles.pageTitle}>Profil</Text>

        {/* Identity card (read-only — provisioned by admin) */}
        <View style={styles.identityCard}>
          <View style={styles.avatarWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[NAVY, NAVY_DEEP]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.avatar, styles.avatarInitials]}
              >
                <Text style={styles.initialsText}>{initials}</Text>
              </LinearGradient>
            )}
          </View>

          <Text style={styles.name} numberOfLines={1}>{user?.name || 'Petugas'}</Text>
          {user?.email && <Text style={styles.email} numberOfLines={1}>{user.email}</Text>}

          <View style={styles.badgesRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
              <MaterialCommunityIcons
                name={isAdmin ? 'shield-crown-outline' : 'shield-account-outline'}
                size={12}
                color={roleColor}
              />
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
            </View>
            <View style={styles.dutyBadge}>
              <View style={styles.dutyDot} />
              <Text style={styles.dutyText}>Bertugas</Text>
            </View>
          </View>
        </View>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statsCol}>
            <Text style={styles.statsValue}>{loadingStats ? '·' : stats?.total ?? 0}</Text>
            <Text style={styles.statsLabel}>Ditangani</Text>
          </View>
          <View style={styles.statsSep} />
          <View style={styles.statsCol}>
            <Text style={[styles.statsValue, { color: '#1D4ED8' }]}>
              {loadingStats ? '·' : stats?.active ?? 0}
            </Text>
            <Text style={styles.statsLabel}>Aktif</Text>
          </View>
          <View style={styles.statsSep} />
          <View style={styles.statsCol}>
            <Text style={[styles.statsValue, { color: '#15803D' }]}>
              {loadingStats ? '·' : stats?.resolved ?? 0}
            </Text>
            <Text style={styles.statsLabel}>Selesai</Text>
          </View>

          {loadingStats && (
            <View style={styles.statsLoader} pointerEvents="none">
              <ActivityIndicator size="small" color={NAVY} />
            </View>
          )}
        </View>

        {/* Menu — note: Informasi Akun dihapus, profil petugas dikelola admin */}
        <View style={styles.menuCard}>
          <MenuRow
            icon="time-outline"
            iconBg="#DCFCE7"
            iconColor="#15803D"
            label="Riwayat Penanganan"
            onPress={() => router.push('/(petugas)/riwayat' as any)}
          />
          <Divider />
          <MenuRow
            icon="notifications-outline"
            iconBg="#FEF3C7"
            iconColor="#B45309"
            label="Notifikasi"
            onPress={() => router.push('/(petugas)/notifikasi' as any)}
          />
          <Divider />
          <MenuRow
            icon="help-circle-outline"
            iconBg={LAVENDER_BG}
            iconColor={LAVENDER_FG}
            label="Bantuan"
            onPress={() => router.push('/(petugas)/bantuan' as any)}
          />
        </View>

        {/* Logout — pill style matching Figma */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={17} color="#DC2626" />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Aegis Call · Petugas v1.0</Text>
      </ScrollView>
      <dialog.Dialog />
    </View>
  );
}

function MenuRow({ icon, iconBg, iconColor, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={15} color={SUB} />
    </TouchableOpacity>
  );
}

function Divider() { return <View style={styles.divider} />; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_BOTTOM },

  scroll: { paddingHorizontal: 18, paddingBottom: 28, gap: 14 },

  pageTitle: { fontSize: 28, fontWeight: '800', color: TEXT, letterSpacing: -0.5, marginBottom: 6 },

  // ── Identity card ──
  identityCard: {
    backgroundColor: CARD,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar:     { width: 76, height: 76, borderRadius: 38 },
  avatarInitials: { alignItems: 'center', justifyContent: 'center' },
  initialsText:   { color: '#fff', fontSize: 28, fontWeight: '800' },
  editBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  name:  { fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: -0.2, textTransform: 'capitalize' },
  email: { fontSize: 12, color: MUTED, marginTop: 3 },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  dutyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
  },
  dutyDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  dutyText: { fontSize: 11, color: '#15803D', fontWeight: '800', letterSpacing: 0.2 },

  // ── Stats card ──
  statsCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  statsCol:   { flex: 1, alignItems: 'center', gap: 4 },
  statsValue: { fontSize: 24, fontWeight: '800', color: NAVY, letterSpacing: -0.5 },
  statsLabel: { fontSize: 11.5, color: MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  statsSep:   { width: 1, backgroundColor: '#E5E7EB' },
  statsLoader:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },

  // ── Menu ──
  menuCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: TEXT, fontWeight: '600' },
  divider:   { height: 1, backgroundColor: '#F1F5F9', marginLeft: 62 },

  // ── Logout pill ──
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 15,
    borderWidth: 1.5, borderColor: '#FECACA',
    marginTop: 4,
  },
  logoutText: { color: '#DC2626', fontSize: 14, fontWeight: '800' },

  footer: { textAlign: 'center', color: SUB, fontSize: 11, marginTop: 8, fontWeight: '500' },
});
