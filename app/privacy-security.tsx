import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';
import { deleteAllContacts } from '../services/contactsService';
import { addNotification } from '../services/notificationsService';

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

  const [locationOn, setLocationOn] = useState(true);
  const [notifOn, setNotifOn] = useState(true);
  const [contactsOn, setContactsOn] = useState(false);
  const [confirmSOS, setConfirmSOS] = useState(true);
  const [pinEdit, setPinEdit] = useState(false);

  const handleDeleteAll = () => {
    Alert.alert(
      t('ps_delete_confirm_title'),
      t('ps_delete_confirm_msg'),
      [
        { text: t('ec_cancel'), style: 'cancel' },
        {
          text: t('ec_delete'),
          style: 'destructive',
          onPress: () => {
            deleteAllContacts();
            addNotification({
              type: 'security',
              title: t('ps_delete_btn'),
              body: t('ps_deleted'),
            });
            Alert.alert('!', t('ps_deleted'));
          },
        },
      ],
    );
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

          {/* Permissions */}
          <Text style={styles.section}>{t('ps_perm_section')}</Text>
          <View style={styles.card}>
            <ToggleRow
              icon="map-marker"
              title={t('ps_perm_location')}
              subtitle={t('ps_perm_location_sub')}
              value={locationOn}
              onValueChange={setLocationOn}
              color="#2563EB"
            />
            <View style={styles.sep} />
            <ToggleRow
              icon="bell"
              title={t('ps_perm_notif')}
              subtitle={t('ps_perm_notif_sub')}
              value={notifOn}
              onValueChange={setNotifOn}
              color="#EA580C"
            />
            <View style={styles.sep} />
            <ToggleRow
              icon="account-group"
              title={t('ps_perm_contacts')}
              subtitle={t('ps_perm_contacts_sub')}
              value={contactsOn}
              onValueChange={setContactsOn}
              color="#059669"
            />
          </View>

          {/* Safety */}
          <Text style={styles.section}>{t('ps_safety_section')}</Text>
          <View style={styles.card}>
            <ToggleRow
              icon="shield-alert"
              title={t('ps_confirm_sos')}
              subtitle={t('ps_confirm_sos_sub')}
              value={confirmSOS}
              onValueChange={setConfirmSOS}
              color="#DC2626"
            />
            <View style={styles.sep} />
            <ToggleRow
              icon="lock"
              title={t('ps_pin_edit')}
              subtitle={t('ps_pin_edit_sub')}
              value={pinEdit}
              onValueChange={setPinEdit}
              color="#7C3AED"
            />
          </View>

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

  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 },
  sep: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 66 },

  dataMsg: { fontSize: 13, color: '#374151', lineHeight: 20 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 12,
    paddingVertical: 14, marginTop: 24,
  },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
