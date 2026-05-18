// Compact audio player used inside chat bubbles. Single play/pause toggle
// with an optional duration display. Cleans up the Sound instance on unmount.

import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ChatAudioPlayer({
  uri,
  tint = '#003B71',
  onTint = '#FFFFFF',
}: {
  uri: string;
  tint?: string;
  onTint?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => null); };
  }, []);

  const toggle = async () => {
    if (playing && soundRef.current) {
      await soundRef.current.stopAsync().catch(() => null);
      await soundRef.current.unloadAsync().catch(() => null);
      soundRef.current = null;
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      if (status.isLoaded && status.durationMillis) {
        setDurationMs(status.durationMillis);
      }
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.isLoaded && s.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync().catch(() => null);
          soundRef.current = null;
        }
      });
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const seconds = durationMs ? Math.round(durationMs / 1000) : null;
  const durationLabel = seconds !== null
    ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
    : 'Voice';

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.row}>
      <View style={[styles.btn, { backgroundColor: onTint + '22' }]}>
        {loading
          ? <ActivityIndicator color={onTint} size="small" />
          : <Ionicons name={playing ? 'pause' : 'play'} size={16} color={onTint} />}
      </View>
      <View style={styles.bar}>
        <View style={[styles.barBg, { backgroundColor: onTint + '33' }]}>
          {[0.35, 0.65, 0.5, 0.85, 0.4, 0.7, 0.55, 0.9, 0.45, 0.6, 0.75, 0.5].map((h, i) => (
            <View
              key={i}
              style={[
                styles.barTick,
                { height: 14 * h, backgroundColor: onTint + 'CC' },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={[styles.dur, { color: onTint }]}>{durationLabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 180 },
  btn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bar: { flex: 1, height: 18, justifyContent: 'center' },
  barBg: { flex: 1, height: 18, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  barTick: { width: 2, borderRadius: 1 },
  dur: { fontSize: 11, fontWeight: '700', minWidth: 32, textAlign: 'right' },
});
