// Recording + playback hook with rolling metering levels for the waveform UI.
// Uses expo-audio (expo-av is deprecated in SDK 54).

import {
  AudioModule,
  createAudioPlayer,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  type AudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  } as any);

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const msAccRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      try { playerRef.current?.remove(); } catch { /* ignore */ }
      recorder.stop().catch(() => null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return;

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true } as any);
      await recorder.prepareToRecordAsync();
      recorder.record();

      setIsRecording(true);
      setDuration(0);
      setLevels([]);
      msAccRef.current = 0;

      pollRef.current = setInterval(() => {
        msAccRef.current += POLL_MS;
        if (msAccRef.current >= 1000) {
          msAccRef.current = 0;
          setDuration(prev => prev + 1);
        }

        try {
          const st: any = (recorder as any).getStatus?.();
          const m = st?.metering ?? (recorder as any).currentMetering;
          if (typeof m === 'number') {
            // metering is dBFS (–160 to 0). Map –60…0 → 0…1
            const norm = Math.max(0, Math.min(1, (m + 60) / 60));
            setLevels(prev => {
              const next = [...prev, norm];
              return next.length > MAX_LEVELS ? next.slice(next.length - MAX_LEVELS) : next;
            });
          }
        } catch { /* ignore */ }
      }, POLL_MS);
    } catch (e) {
      console.warn('Recording start failed:', e);
    }
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsRecording(false);

    try {
      await recorder.stop();
      const uri = recorder.uri ?? null;
      if (uri) setAudioUri(uri);
      return uri;
    } catch {
      return null;
    }
  }, [recorder]);

  const playAudio = useCallback(async () => {
    if (!audioUri) return;
    try {
      try { playerRef.current?.remove(); } catch { /* ignore */ }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true } as any);
      const player = createAudioPlayer({ uri: audioUri });
      playerRef.current = player;
      player.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish) {
          try { player.remove(); } catch { /* ignore */ }
          if (playerRef.current === player) playerRef.current = null;
        }
      });
      player.play();
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
