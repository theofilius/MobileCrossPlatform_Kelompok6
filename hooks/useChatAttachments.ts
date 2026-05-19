// Shared chat attachment hook: pick image from gallery/camera + record voice memo.
// Used by both user-side (app/report-chat.tsx) and petugas-side (app/(petugas)/chat.tsx).
// Uses expo-audio (expo-av is deprecated in SDK 54).

import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

export type ImageSource = 'camera' | 'gallery';

export function useChatAttachments() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      // Defensive: stop on unmount if still active. recorder.stop is idempotent.
      recorder.stop().catch(() => null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Photo ────────────────────────────────────
  const pickImage = useCallback(async (source: ImageSource): Promise<string | null> => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aktifkan akses kamera di pengaturan HP.');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (result.canceled) return null;
      return result.assets[0].uri;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aktifkan akses galeri di pengaturan HP.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return null;
    return result.assets[0].uri;
  }, []);

  // ── Voice ────────────────────────────────────
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin Ditolak', 'Aktifkan akses mikrofon di pengaturan HP.');
        return false;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true } as any);
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAtRef.current = Date.now();
      setRecordingMs(0);
      setIsRecording(true);
      tickRef.current = setInterval(() => {
        setRecordingMs(Date.now() - startedAtRef.current);
      }, 200);
      return true;
    } catch (e: any) {
      Alert.alert('Gagal mulai rekam', e?.message ?? 'Coba lagi.');
      return false;
    }
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecording) return null;
    try {
      await recorder.stop();
      return recorder.uri ?? null;
    } catch {
      return null;
    } finally {
      setIsRecording(false);
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }
  }, [recorder, isRecording]);

  const cancelRecording = useCallback(async () => {
    setIsRecording(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    await recorder.stop().catch(() => null);
  }, [recorder]);

  return {
    pickImage,
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    recordingMs,
  };
}
