// Branded alert/confirm dialog. Matches the Figma "Saved!" style:
// rounded white card, large icon, title + body, navy pill button.
//
// Usage with the lightweight hook:
//   const dialog = useDialog();
//   dialog.show({ type: 'success', title: 'Laporan Terkirim', body: '...' });
//   ...
//   <dialog.Dialog />
//
// Or directly render <Dialog visible={...} {...} /> if you manage state yourself.

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const NAVY = '#003B71';
const TEXT = '#0F172A';
const MUTED = '#475569';

export type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export type DialogConfig = {
  type?: DialogType;
  title: string;
  body?: string;
  primaryText?: string;
  secondaryText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  // If false, dialog stays open after onPrimary; caller closes it manually.
  autoClose?: boolean;
};

const ICON_FOR: Record<DialogType, { name: any; color: string; bg: string }> = {
  success:  { name: 'checkmark',         color: '#15803D', bg: '#DCFCE7' },
  error:    { name: 'close',             color: '#DC2626', bg: '#FEE2E2' },
  warning:  { name: 'alert',             color: '#B45309', bg: '#FEF3C7' },
  info:     { name: 'information',       color: '#1D4ED8', bg: '#DBEAFE' },
  confirm:  { name: 'help',              color: '#1D4ED8', bg: '#DBEAFE' },
};

export function Dialog({
  visible,
  type = 'info',
  title,
  body,
  primaryText = 'OK',
  secondaryText,
  onPrimary,
  onSecondary,
  onDismiss,
}: DialogConfig & { visible: boolean; onDismiss?: () => void }) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scale,   { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.92);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  const icon = ICON_FOR[type];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={type !== 'confirm' ? onDismiss : undefined} />
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name} size={32} color={icon.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}

          <View style={styles.actions}>
            {secondaryText ? (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={onSecondary}
                activeOpacity={0.85}
              >
                <Text style={styles.btnSecondaryText}>{secondaryText}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.btnPrimary, secondaryText && { flex: 1 }]}
              onPress={onPrimary ?? onDismiss}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>{primaryText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/** Local-state dialog hook. Returns { show, hide, Dialog }. */
export function useDialog() {
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const show = (cfg: DialogConfig) => setConfig(cfg);
  const hide = () => setConfig(null);

  const wrappedOnPrimary = () => {
    const cb = config?.onPrimary;
    if (config?.autoClose !== false) hide();
    cb?.();
  };

  const wrappedOnSecondary = () => {
    const cb = config?.onSecondary;
    hide();
    cb?.();
  };

  const DialogComponent = () => (
    <Dialog
      visible={!!config}
      type={config?.type}
      title={config?.title ?? ''}
      body={config?.body}
      primaryText={config?.primaryText}
      secondaryText={config?.secondaryText}
      onPrimary={wrappedOnPrimary}
      onSecondary={wrappedOnSecondary}
      onDismiss={hide}
    />
  );

  return { show, hide, Dialog: DialogComponent };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: TEXT, textAlign: 'center', marginBottom: 6 },
  body:  { fontSize: 13.5, color: MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 18 },

  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 6 },
  btnPrimary: {
    backgroundColor: NAVY,
    borderRadius: 24,
    paddingVertical: 14,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  btnSecondary: {
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingVertical: 14,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { color: TEXT, fontSize: 14, fontWeight: '700' },
});
