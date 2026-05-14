import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type AudioHook = {
  isRecording: boolean;
  duration: number;
  audioUri: string | null;
  levels: number[]; // rolling array of 0-1 normalized amplitude samples
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  playAudio: () => Promise<void>;
  clearAudio: () => void;
};

const POLL_MS = 80;
const MAX_LEVELS = 40;

export function useAudio(): AudioHook {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>([]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const msAccRef = useRef(0); // accumulator for duration counting

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);
      setLevels([]);
      msAccRef.current = 0;

      pollRef.current = setInterval(async () => {
        if (!recordingRef.current) return;

        msAccRef.current += POLL_MS;
        if (msAccRef.current >= 1000) {
          msAccRef.current = 0;
          setDuration(prev => prev + 1);
        }

        try {
          const st = await recordingRef.current.getStatusAsync();
          if (st.isRecording && st.metering !== undefined) {
            // metering is dBFS (–160 to 0). Map –60…0 → 0…1
            const norm = Math.max(0, Math.min(1, (st.metering + 60) / 60));
            setLevels(prev => {
              const next = [...prev, norm];
              return next.length > MAX_LEVELS ? next.slice(next.length - MAX_LEVELS) : next;
            });
          }
        } catch {}
      }, POLL_MS);
    } catch (e) {
      console.warn('Recording start failed:', e);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setIsRecording(false);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI() ?? null;
      recordingRef.current = null;
      if (uri) setAudioUri(uri);
      return uri;
    } catch {
      return null;
    }
  }, []);

  const playAudio = useCallback(async () => {
    if (!audioUri) return;
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.warn('Playback failed:', e);
    }
  }, [audioUri]);

  const clearAudio = useCallback(() => {
    setAudioUri(null);
    setDuration(0);
    setLevels([]);
  }, []);

  return { isRecording, duration, audioUri, levels, startRecording, stopRecording, playAudio, clearAudio };
}