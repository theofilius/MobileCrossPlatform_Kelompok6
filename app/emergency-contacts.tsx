import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';
import {
  ContactPriority,
  EmergencyContact,
  addContact,
  deleteContact,
  getContacts,
  subscribe,
  updateContact,
} from '../services/contactsService';
import { addNotification } from '../services/notificationsService';

const PRIORITY_COLOR: Record<ContactPriority, string> = {
  primary: '#DC2626',
  secondary: '#0C4F8D',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function sanitizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [contacts, setContacts] = useState<EmergencyContact[]>(getContacts());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [priority, setPriority] = useState<ContactPriority>('secondary');

  useEffect(() => subscribe(setContacts), []);

  const relationshipOptions = t('ec_relationships').split(',');

  const openAdd = () => {
    setEditing(null);
    setName('');
    setRelationship(relationshipOptions[0] ?? '');
    setPhone('');
    setPriority(contacts.length === 0 ? 'primary' : 'secondary');
    setModalOpen(true);
  };

  const openEdit = (c: EmergencyContact) => {
    setEditing(c);
    setName(c.name);
    setRelationship(c.relationship);
    setPhone(c.phone);
    setPriority(c.priority);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('!', t('ec_val_name')); return; }
    const cleaned = sanitizePhone(phone);
    if (!cleaned) { Alert.alert('!', t('ec_val_phone')); return; }

    if (editing) {
      updateContact(editing.id, {
        name: name.trim(),
        relationship: relationship.trim() || relationshipOptions[0],
        phone: cleaned,
        priority,
      });
    } else {
      addContact({
        name: name.trim(),
        relationship: relationship.trim() || relationshipOptions[0],
        phone: cleaned,
        priority,
      });
      addNotification({
        type: 'contact',
        title: t('ec_add'),
        body: name.trim(),
      });
    }
    setModalOpen(false);
  };

  const handleDelete = (c: EmergencyContact) => {
    Alert.alert(
      t('ec_delete_confirm_title'),
      t('ec_delete_confirm_msg'),
      [
        { text: t('ec_cancel'), style: 'cancel' },
        {
          text: t('ec_delete'),
          style: 'destructive',
          onPress: () => {
            deleteContact(c.id);
            addNotification({
              type: 'contact',
              title: t('ec_delete'),
              body: c.name,
            });
          },
        },
      ],
    );
  };

  const handleCall = (c: EmergencyContact) => {
    const url = `tel:${c.phone}`;
    Linking.openURL(url).catch(() => Alert.alert('!', 'Tidak dapat melakukan panggilan.'));
  };

  const handleWhatsApp = (c: EmergencyContact) => {
    const cleaned = c.phone.replace(/[^\d]/g, '');
    Linking.openURL(`https://wa.me/${cleaned}`).catch(() =>
      Alert.alert('!', 'WhatsApp tidak terpasang.')
    );
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('ec_title')}</Text>
          <TouchableOpacity style={styles.addBtnTop} onPress={openAdd}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={contacts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isPrimary = item.priority === 'primary';
            return (
              <View style={[styles.card, isPrimary && styles.cardPrimary]}>
                {isPrimary && (
                  <View style={styles.primaryBadge}>
                    <MaterialCommunityIcons name="star" size={11} color="#FFFFFF" />
                    <Text style={styles.primaryBadgeText}>{t('ec_primary_label')}</Text>
                  </View>
                )}

                <View style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: PRIORITY_COLOR[item.priority] + '18' }]}>
                    <Text style={[styles.avatarText, { color: PRIORITY_COLOR[item.priority] }]}>
                      {getInitials(item.name)}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.relationship}>{item.relationship}</Text>
                    <Text style={styles.phone}>{item.phone}</Text>
                  </View>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={() => handleCall(item)}>
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.actionTextLight}>{t('ec_call')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={() => handleWhatsApp(item)}>
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    <Text style={styles.actionTextLight}>{t('ec_message')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-multiple-plus-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>{t('ec_empty_title')}</Text>
              <Text style={styles.emptySub}>{t('ec_empty_sub')}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>{t('ec_add')}</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Add/Edit Modal */}
        <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editing ? t('ec_edit') : t('ec_add')}</Text>
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 480 }} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalLabel}>{t('ec_name')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('ec_name')}
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.modalLabel}>{t('ec_relationship')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {relationshipOptions.map(opt => {
                    const active = relationship === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setRelationship(opt)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.modalLabel}>{t('ec_phone')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+62…"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />

                <Text style={styles.modalLabel}>{t('ec_priority')}</Text>
                <View style={styles.priorityRow}>
                  <TouchableOpacity
                    style={[styles.priorityBtn, priority === 'primary' && styles.priorityBtnActive]}
                    onPress={() => setPriority('primary')}
                  >
                    <MaterialCommunityIcons name="star" size={14} color={priority === 'primary' ? '#FFFFFF' : '#9CA3AF'} />
                    <Text style={[styles.priorityText, priority === 'primary' && styles.priorityTextActive]}>
                      {t('ec_primary')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priorityBtn, priority === 'secondary' && styles.priorityBtnActive]}
                    onPress={() => setPriority('secondary')}
                  >
                    <Ionicons name="people" size={14} color={priority === 'secondary' ? '#FFFFFF' : '#9CA3AF'} />
                    <Text style={[styles.priorityText, priority === 'secondary' && styles.priorityTextActive]}>
                      {t('ec_secondary')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalOpen(false)}>
                  <Text style={styles.modalCancelText}>{t('ec_cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSave}>
                  <Text style={styles.modalSaveText}>{t('ec_save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#003B71' },
  addBtnTop: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#003B71',
    justifyContent: 'center', alignItems: 'center',
  },

  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardPrimary: { borderWidth: 1.5, borderColor: '#DC2626' + '33' },
  primaryBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, marginBottom: 8,
  },
  primaryBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  relationship: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  phone: { fontSize: 13, color: '#374151', marginTop: 3, fontWeight: '500' },
  iconBtn: { padding: 6 },

  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 38, borderRadius: 10,
  },
  callBtn: { backgroundColor: '#0C4F8D' },
  waBtn: { backgroundColor: '#25D366' },
  actionTextLight: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FEE2E2',
  },

  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginTop: 4 },
  emptySub: { fontSize: 13, color: '#D1D5DB', textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#003B71', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, marginTop: 12,
  },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#003B71' },
  modalLabel: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14,
    height: 48, fontSize: 14, color: '#111827',
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18,
    backgroundColor: '#F3F4F6', marginRight: 6,
  },
  chipActive: { backgroundColor: '#003B71' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#FFFFFF' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6',
  },
  priorityBtnActive: { backgroundColor: '#003B71' },
  priorityText: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  priorityTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: {
    flex: 1, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  modalSave: {
    flex: 2, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#003B71',
  },
  modalSaveText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
