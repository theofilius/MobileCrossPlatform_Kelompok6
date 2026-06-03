import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { AuthContext } from '@/context/AuthContext';
import { deleteAllContacts } from '../services/contactsService';
import { addNotification } from '../services/notificationsService';
import { useDialog } from '../components/aegis/Dialog';

type RowProps = {
  icon: string;
  iconSet?: 'mat' | 'ion';
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  color?: string;
};

function ToggleRow({ icon, iconSet = 'mat', title, subtitle, value, onValueChange, color = '#0C4F8D' }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
        {iconSet === 'mat' ? (
          <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        ) : (
          <Ionicons name={icon as any} size={20} color={color} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#0C4F8D' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const dialog = useDialog();
  const { user, updateUser } = useContext(AuthContext);

  // Komunitas Siaga: persists to profiles.community_siaga_opt_in.
  // Optimistic local state so the switch animates instantly while the DB
  // round-trip happens in the background.
  const [siagaBusy, setSiagaBusy] = useState(false);
  const siagaOptIn = user?.communitySiagaOptIn ?? false;

  const handleToggleSiaga = async (next: boolean) => {
    if (siagaBusy) return;
    setSiagaBusy(true);
    try {
      await updateUser({ communitySiagaOptIn: next });
    } catch (err) {
      console.warn('[ps] toggle siaga failed', err);
      dialog.show({
        type: 'error',
        title: 'Gagal',
        body: 'Tidak dapat menyimpan preferensi. Coba lagi.',
        primaryText: 'OK',
      });
    } finally {
      setSiagaBusy(false);
    }
  };

  const handleDeleteAll = () => {
    dialog.show({
      type: 'warning',
      title: t('ps_delete_confirm_title'),
      body: t('ps_delete_confirm_msg'),
      primaryText: t('ec_delete'),
      secondaryText: t('ec_cancel'),
      onPrimary: () => {
        deleteAllContacts();
        addNotification({
          type: 'security',
          title: t('ps_delete_btn'),
          body: t('ps_deleted'),
        });
        dialog.show({
          type: 'success',
          title: '!',
          body: t('ps_deleted'),
          primaryText: 'OK',
        });
      },
    });
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('ps_title')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Komunitas Siaga — opt-in nearby SOS alerts. Only meaningful for
              regular users; petugas/admin get the dashboard feed instead. */}
          {user?.role === 'user' && (
            <>
              <Text style={styles.section}>Komunitas Siaga</Text>
              <View style={styles.card}>
                <ToggleRow
                  icon="shield-account"
                  title="Terima alert SOS sekitar"
                  subtitle="Dapatkan notifikasi jika ada pengguna lain memicu SOS dalam radius 5 km."
                  value={siagaOptIn}
                  onValueChange={handleToggleSiaga}
                  color="#DC2626"
                />
              </View>
              <Text style={styles.siagaHint}>
                Lokasi presisi korban tidak akan ditampilkan. Anda hanya melihat jarak perkiraan.
              </Text>
            </>
          )}

          {/* Izin Aplikasi — point user to OS settings rather than fake toggles.
              Lokasi, notifikasi, dan kontak diatur di system settings; tombol
              di app ini hanya bisa membuka panel pengaturan. */}
          <Text style={styles.section}>{t('ps_perm_section')}</Text>
          <TouchableOpacity
            style={styles.linkCard}
            activeOpacity={0.85}
            onPress={() => Linking.openSettings().catch(() => undefined)}
          >
            <View style={[styles.iconBox, { backgroundColor: '#2563EB18' }]}>
              <Ionicons name="settings-sharp" size={20} color="#2563EB" />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>Kelola izin di Pengaturan</Text>
              <Text style={styles.subtitle}>
                Lokasi, notifikasi, dan kontak diatur di pengaturan sistem perangkat Anda.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Data Usage */}
          <Text style={styles.section}>{t('ps_data_section')}</Text>
          <View style={[styles.card, { padding: 14 }]}>
            <Text style={styles.dataMsg}>{t('ps_data_msg')}</Text>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAll}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.deleteText}>{t('ps_delete_btn')}</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
      <dialog.Dialog />
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#003B71' },

  scroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },

  section: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginTop: 16, marginBottom: 8, marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  linkCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 },
  sep: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 66 },

  dataMsg: { fontSize: 13, color: '#374151', lineHeight: 20 },
  siagaHint: { fontSize: 11.5, color: '#6B7280', marginTop: 8, marginLeft: 4, lineHeight: 16 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 12,
    paddingVertical: 14, marginTop: 24,
  },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
