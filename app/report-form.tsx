import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
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
import { useCamera } from '../hooks/useCamera';
import { useLocation } from '../hooks/useLocation';
import { clearPendingAudio, getPendingAudio } from '../utils/pendingAudio';
import { useLanguage } from './context/LanguageContext';
import { TranslationKey } from '../translations';
import {
  EMERGENCY_COLORS,
  EmergencyType,
  createReport,
} from '../services/reportService';

const TYPE_KEY: Record<EmergencyType, TranslationKey> = {
  fire: 'type_fire',
  accident: 'type_accident',
  crime: 'type_crime',
  disaster: 'type_disaster',
  medical: 'type_medical',
  other: 'type_other',
};

export default function ReportFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: EmergencyType; audioUri?: string }>();
  const type = (params.type as EmergencyType) || 'other';

  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(params.audioUri ?? null);
  const [submitting, setSubmitting] = useState(false);

  const { coords, address, loading: locLoading, refresh: refreshLocation } = useLocation();
  const { capturePhoto, pickFromGallery } = useCamera();
  const { t } = useLanguage();

  const [manualAddress, setManualAddress] = useState<string | null>(null);
  const [manualCoords, setManualCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [locDraft, setLocDraft] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Final displayed address & coords: manual override wins if set
  const displayAddress = manualAddress ?? address;
  const displayCoords = manualCoords ?? coords;

  const openEditLocation = () => {
    setLocDraft(displayAddress);
    setLocModalOpen(true);
  };

  const handleSaveLocation = async () => {
    const trimmed = locDraft.trim();
    if (trimmed.length === 0) {
      setManualAddress(null);
      setManualCoords(null);
      setLocModalOpen(false);
      return;
    }
    setGeocoding(true);
    try {
      // Forward geocode: text → lat/lng using device-native geocoder (free, no key)
      const results = await Location.geocodeAsync(trimmed);
      if (results.length > 0) {
        setManualAddress(trimmed);
        setManualCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
      } else {
        // Couldn't resolve — still save the text but keep previous coords
        setManualAddress(trimmed);
        Alert.alert('!', 'Lokasi tidak ditemukan di peta. Alamat tetap disimpan, tapi pin peta mungkin tidak akurat.');
      }
    } catch {
      setManualAddress(trimmed);
      Alert.alert('!', 'Gagal mencari lokasi. Coba lagi.');
    } finally {
      setGeocoding(false);
      setLocModalOpen(false);
    }
  };

  const handleUseGps = async () => {
    setManualAddress(null);
    setManualCoords(null);
    await refreshLocation();
    setLocDraft(address);
  };

  useFocusEffect(
    useCallback(() => {
      const uri = getPendingAudio();
      if (uri) {
        setAudioUri(uri);
        clearPendingAudio();
      }
    }, [])
  );

  const accentColor = EMERGENCY_COLORS[type];
  const typeLabel = t(TYPE_KEY[type]);

  const handlePhoto = () => {
    Alert.alert(t('report_photo_title'), t('report_photo_source'), [
      { text: t('report_camera'), onPress: async () => { const uri = await capturePhoto(); if (uri) setPhotoUri(uri); } },
      { text: t('report_gallery'), onPress: async () => { const uri = await pickFromGallery(); if (uri) setPhotoUri(uri); } },
      { text: t('report_cancel'), style: 'cancel' },
    ]);
  };

  const handleAudio = () => {
    router.push({ pathname: '/audio-recording', params: { returnTo: 'report-form', type } } as any);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('!', t('report_val_desc'));
      return;
    }
    setSubmitting(true);
    try {
      createReport({
        type,
        description: description.trim(),
        latitude: displayCoords?.latitude ?? null,
        longitude: displayCoords?.longitude ?? null,
        address: displayAddress,
        photoUri,
        audioUri,
        userId: undefined,
      });
      Alert.alert(
        t('report_success_title'),
        t('report_success_msg'),
        [{ text: 'OK', onPress: () => router.replace('/(tabs)' as any) }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#003B71" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>{t('report_title')}</Text>
            <View style={styles.typeBadge}>
              <View style={[styles.typeDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.typeText, { color: accentColor }]}>{typeLabel}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Location card */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="location" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>{t('report_location')}</Text>
                  <Text style={styles.cardValue} numberOfLines={2}>
                    {locLoading && !manualAddress ? t('report_loading_loc') : displayAddress}
                  </Text>
                </View>
                <TouchableOpacity onPress={openEditLocation} hitSlop={8}>
                  <Ionicons name="pencil-outline" size={18} color="#003B71" />
                </TouchableOpacity>
              </View>

              {displayCoords && (
                <View style={styles.mapPreviewWrap}>
                  <MapView
                    style={styles.mapPreview}
                    provider={PROVIDER_DEFAULT}
                    region={{
                      latitude: displayCoords.latitude,
                      longitude: displayCoords.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: displayCoords.latitude,
                        longitude: displayCoords.longitude,
                      }}
                      pinColor={accentColor}
                    />
                  </MapView>
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>{t('report_desc_label')}</Text>
              <TextInput
                style={styles.textArea}
                placeholder={t('report_desc_ph')}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.charCount}>{description.length} {t('report_chars')}</Text>
            </View>

            {/* Media section */}
            <Text style={styles.sectionLabel}>{t('report_evidence')}</Text>

            {/* Photo */}
            <TouchableOpacity style={styles.mediaCard} onPress={handlePhoto} activeOpacity={0.8}>
              {photoUri ? (
                <View style={styles.photoPreviewRow}>
                  <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.mediaTitle}>{t('report_photo_attached')}</Text>
                    <Text style={styles.mediaSub}>{t('report_photo_change')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPhotoUri(null)}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mediaEmptyRow}>
                  <View style={[styles.mediaIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="camera" size={22} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.mediaTitle}>{t('report_add_photo')}</Text>
                    <Text style={styles.mediaSub}>{t('report_photo_source')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#C1C1C1" />
                </View>
              )}
            </TouchableOpacity>

            {/* Audio */}
            <TouchableOpacity style={styles.mediaCard} onPress={handleAudio} activeOpacity={0.8}>
              <View style={styles.mediaEmptyRow}>
                <View style={[styles.mediaIconBox, { backgroundColor: audioUri ? '#F0FDF4' : '#FFF7ED' }]}>
                  <Ionicons
                    name={audioUri ? 'checkmark-circle' : 'mic'}
                    size={22}
                    color={audioUri ? '#059669' : '#EA580C'}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.mediaTitle}>
                    {audioUri ? t('report_audio_attached') : t('report_audio')}
                  </Text>
                  <Text style={styles.mediaSub}>
                    {audioUri ? t('report_audio_retake') : t('report_audio_sub')}
                  </Text>
                </View>
                {audioUri ? (
                  <TouchableOpacity onPress={() => setAudioUri(null)}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#C1C1C1" />
                )}
              </View>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: accentColor }, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>
                {submitting ? t('report_submitting') : t('report_submit')}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* Edit Location Modal */}
        <Modal
          visible={locModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setLocModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.locModalOverlay}
          >
            <View style={styles.locModalCard}>
              <View style={styles.locModalHeader}>
                <Text style={styles.locModalTitle}>{t('report_edit_loc_title')}</Text>
                <TouchableOpacity onPress={() => setLocModalOpen(false)} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.locModalHint}>{t('report_edit_loc_hint')}</Text>

              <TextInput
                style={styles.locInput}
                value={locDraft}
                onChangeText={setLocDraft}
                placeholder={t('report_edit_loc_ph')}
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.gpsBtn} onPress={handleUseGps} disabled={locLoading}>
                <Ionicons name="locate" size={16} color="#003B71" />
                <Text style={styles.gpsBtnText}>
                  {locLoading ? t('report_loading_loc') : t('report_use_gps')}
                </Text>
              </TouchableOpacity>

              <View style={styles.locModalActions}>
                <TouchableOpacity style={styles.locCancel} onPress={() => setLocModalOpen(false)}>
                  <Text style={styles.locCancelText}>{t('ec_cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.locSave, geocoding && { opacity: 0.7 }]}
                  onPress={handleSaveLocation}
                  disabled={geocoding}
                >
                  <Text style={styles.locSaveText}>
                    {geocoding ? t('report_loading_loc') : t('ec_save')}
                  </Text>
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
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  topTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#003B71',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeText: { fontSize: 12, fontWeight: '700' },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },

  mapPreviewWrap: {
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    height: 140,
    backgroundColor: '#EAF3FB',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  textArea: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 22,
    minHeight: 110,
    paddingTop: 0,
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 6,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 2,
  },

  mediaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  mediaEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  mediaSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  photoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  submitBtn: {
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Location edit modal
  locModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  locModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  locModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#003B71',
  },
  locModalHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  locInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    lineHeight: 20,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gpsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003B71',
  },
  locModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  locCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  locCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  locSave: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#003B71',
  },
  locSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});