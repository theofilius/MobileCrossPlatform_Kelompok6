// Shared chat attachment hook: pick image from gallery/camera + record voice memo.
// Used by both user-side (app/report-chat.tsx) and petugas-side (app/(petugas)/chat.tsx).

import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

export type ImageSource = 'camera' | 'gallery';

export function useChatAttachments() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      // Defensive cleanup on unmount
      if (tickRef.current) clearInterval(tickRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => null);
    };
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
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Izin Ditolak', 'Aktifkan akses mikrofon di pengaturan HP.');
        return false;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
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
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    const rec = recordingRef.current;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      return uri ?? null;
    } catch {
      return null;
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    const rec = recordingRef.current;
    recordingRef.current = null;
    setIsRecording(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (rec) {
      await rec.stopAndUnloadAsync().catch(() => null);
    }
  }, []);

  return {
    pickImage,
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    recordingMs,
  };
}
