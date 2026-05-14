import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';
import { useAudio } from '../hooks/useAudio';
import { setPendingAudio } from '../utils/pendingAudio';

const NUM_BARS = 40;
const MIN_H = 4;
const MAX_H = 54;

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function AudioRecordingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { isRecording, duration, audioUri, levels, startRecording, stopRecording, playAudio, clearAudio } = useAudio();

  const handleRecordToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      clearAudio();
      await startRecording();
    }
  };

  const handleConfirm = () => {
    if (!audioUri) return;
    setPendingAudio(audioUri);
    router.back();
  };

  const handleDiscard = () => {
    clearAudio();
    router.back();
  };

  // Build bar heights from levels array
  const barHeights = useMemo(() => {
    return Array.from({ length: NUM_BARS }, (_, i) => {
      const offset = i - (NUM_BARS - levels.length);
      if (offset < 0 || levels.length === 0) return MIN_H;
      const lvl = levels[offset] ?? 0;
      // Add slight random variation so silent audio still shows a tiny jitter
      return MIN_H + lvl * (MAX_H - MIN_H);
    });
  }, [levels]);

  const statusText = isRecording
    ? t('audio_recording')
    : audioUri
    ? t('audio_done')
    : t('audio_ready');

  const hintText = isRecording
    ? t('audio_hint_recording')
    : audioUri
    ? t('audio_hint_done')
    : t('audio_hint_ready');

  return (
    <LinearGradient colors={['#1E3A5F', '#003B71']} style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleDiscard}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('audio_title')}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Main content */}
        <View style={styles.body}>

          {/* Status indicator */}
          <View style={styles.statusArea}>
            {isRecording ? (
              <>
                <View style={styles.recordingDot} />
                <Text style={styles.statusText}>{statusText}</Text>
              </>
            ) : audioUri ? (
              <>
                <Ionicons name="checkmark-circle" size={14} color="#34D399" />
                <Text style={[styles.statusText, { color: '#34D399' }]}>{statusText}</Text>
              </>
            ) : (
              <Text style={[styles.statusText, { color: 'rgba(255,255,255,0.4)' }]}>{statusText}</Text>
            )}
          </View>

          {/* Timer */}
          <Text style={styles.timer}>{formatDuration(duration)}</Text>

          {/* Animated waveform */}
          <View style={styles.waveform}>
            {barHeights.map((h, i) => {
              const active = isRecording;
              const recorded = !!audioUri && !isRecording;
              const color = active ? '#EF4444' : recorded ? '#34D399' : 'rgba(255,255,255,0.25)';
              const opacity = active
                ? 0.5 + (levels[(i - (NUM_BARS - levels.length)) < 0 ? 0 : i - (NUM_BARS - levels.length)] ?? 0) * 0.5
                : recorded ? 0.7 : 0.3;

              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    { height: h, backgroundColor: color, opacity },
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.hint}>{hintText}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.actionBtn, !audioUri && styles.actionBtnDisabled]}
            onPress={playAudio}
            disabled={!audioUri}
          >
            <Ionicons name="play" size={22} color={audioUri ? '#FFFFFF' : 'rgba(255,255,255,0.3)'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            onPress={handleRecordToggle}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <MaterialCommunityIcons name="microphone" size={36} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, !audioUri && styles.actionBtnDisabled]}
            onPress={clearAudio}
            disabled={!audioUri}
          >
            <Ionicons name="trash-outline" size={22} color={audioUri ? '#FFFFFF' : 'rgba(255,255,255,0.3)'} />
          </TouchableOpacity>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
            <Text style={styles.discardText}>{t('audio_discard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, !audioUri && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!audioUri}
          >
            <Ionicons name="checkmark" size={18} color={audioUri ? '#003B71' : 'rgba(0,59,113,0.4)'} />
            <Text style={[styles.confirmText, !audioUri && { color: 'rgba(0,59,113,0.4)' }]}>
              {t('audio_use')}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  closeBtn: {
    width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },

  statusArea: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  statusText: { fontSize: 12, fontWeight: '800', color: '#EF4444', letterSpacing: 2 },

  timer: {
    fontSize: 64, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: -2, marginBottom: 32,
  },

  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 60,
    marginBottom: 24,
  },
  waveBar: { width: 4, borderRadius: 2 },

  hint: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', fontWeight: '500', lineHeight: 19, paddingHorizontal: 16,
  },

  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 28, marginBottom: 28,
  },
  actionBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  actionBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  recordBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 12,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)',
  },
  recordBtnActive: { backgroundColor: '#DC2626', shadowOpacity: 0.7 },
  stopIcon: { width: 26, height: 26, borderRadius: 5, backgroundColor: '#FFFFFF' },

  bottomRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  discardBtn: {
    flex: 1, height: 52, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  discardText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700' },
  confirmBtn: {
    flex: 2, height: 52, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 14,
  },
  confirmBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.3)' },
  confirmText: { color: '#003B71', fontSize: 15, fontWeight: '800' },
});