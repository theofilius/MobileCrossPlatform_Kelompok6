import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
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
import {
  EMERGENCY_COLORS,
  EMERGENCY_LABELS,
  EmergencyType,
  createReport,
} from '../services/reportService';

export default function ReportFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: EmergencyType; audioUri?: string }>();
  const type = (params.type as EmergencyType) || 'other';

  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(params.audioUri ?? null);
  const [submitting, setSubmitting] = useState(false);

  const { coords, address, loading: locLoading } = useLocation();
  const { capturePhoto, pickFromGallery } = useCamera();

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
  const typeLabel = EMERGENCY_LABELS[type];

  const handlePhoto = () => {
    Alert.alert('Tambah Foto', 'Pilih sumber foto', [
      { text: 'Buka Kamera', onPress: async () => { const uri = await capturePhoto(); if (uri) setPhotoUri(uri); } },
      { text: 'Pilih dari Galeri', onPress: async () => { const uri = await pickFromGallery(); if (uri) setPhotoUri(uri); } },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleAudio = () => {
    router.push({ pathname: '/audio-recording', params: { returnTo: 'report-form', type } } as any);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validasi', 'Tambahkan deskripsi kejadian terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    try {
      createReport({
        type,
        description: description.trim(),
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        address,
        photoUri,
        audioUri,
        userId: undefined,
      });
      Alert.alert(
        'Laporan Terkirim',
        'Laporan kamu telah berhasil dikirim. Tim kami akan segera menindaklanjuti.',
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
            <Text style={styles.topTitle}>Buat Laporan</Text>
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
                  <Text style={styles.cardLabel}>Lokasi Kejadian</Text>
                  <Text style={styles.cardValue} numberOfLines={2}>
                    {locLoading ? 'Memuat lokasi...' : address}
                  </Text>
                </View>
                <TouchableOpacity>
                  <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Deskripsi Kejadian</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ceritakan apa yang terjadi, sedetail mungkin..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.charCount}>{description.length} karakter</Text>
            </View>

            {/* Media section */}
            <Text style={styles.sectionLabel}>Lampiran Bukti</Text>

            {/* Photo */}
            <TouchableOpacity style={styles.mediaCard} onPress={handlePhoto} activeOpacity={0.8}>
              {photoUri ? (
                <View style={styles.photoPreviewRow}>
                  <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.mediaTitle}>Foto terlampir</Text>
                    <Text style={styles.mediaSub}>Ketuk untuk ganti</Text>
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
                    <Text style={styles.mediaTitle}>Tambah Foto</Text>
                    <Text style={styles.mediaSub}>Kamera atau galeri</Text>
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
                    {audioUri ? 'Audio terlampir' : 'Rekam Audio'}
                  </Text>
                  <Text style={styles.mediaSub}>
                    {audioUri ? 'Ketuk untuk rekam ulang' : 'Rekam kesaksian suara'}
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
                {submitting ? 'Mengirim...' : 'Kirim Laporan'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
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
});