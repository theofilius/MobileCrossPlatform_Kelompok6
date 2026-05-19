import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import {
  listReportMessages,
  sendReportMessage,
  subscribeToReportMessages,
  type AttachmentType,
  type ReportMessage,
} from '../services/reportChat';
import { uploadToStorage } from '../services/mediaService';
import { useChatAttachments } from '../hooks/useChatAttachments';
import { ChatAudioPlayer } from '../components/aegis/ChatAudioPlayer';
import { useDialog } from '../components/aegis/Dialog';

const NAVY = '#003B71';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const SUB = '#94A3B8';
const BG = '#F5F7FA';

function formatTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function ReportChatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { reportId, title } = useLocalSearchParams<{ reportId: string; title?: string }>();

  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const listRef = useRef<FlatList>(null);
  const dialog = useDialog();

  const attach = useChatAttachments();

  useEffect(() => {
    if (!reportId) return;
    let mounted = true;
    listReportMessages(reportId)
      .then(rows => { if (mounted) setMessages(rows); })
      .catch(() => { if (mounted) setMessages([]); })
      .finally(() => { if (mounted) setLoading(false); });

    const unsub = subscribeToReportMessages(reportId, (msg) => {
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => { mounted = false; unsub(); };
  }, [reportId]);

  const sendWithAttachment = async (uri: string, kind: 'photo' | 'audio') => {
    if (!reportId || !user?.id) return;
    setSending(true);
    try {
      const url = await uploadToStorage(uri, kind, user.id);
      await sendReportMessage({
        reportId,
        senderId: user.id,
        senderRole: 'user',
        attachmentUrl: url,
        attachmentType: (kind === 'photo' ? 'image' : 'audio') as AttachmentType,
      });
    } catch (e: any) {
      dialog.show({ type: 'error', title: 'Gagal kirim', body: e?.message ?? 'Coba lagi.', primaryText: 'OK' });
    } finally {
      setSending(false);
    }
  };

  const handleSendText = async () => {
    const text = input.trim();
    if (!text || !reportId || !user?.id || sending) return;
    setSending(true);
    setInput('');
    try {
      await sendReportMessage({ reportId, senderId: user.id, senderRole: 'user', message: text });
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleAttachPhoto = async (source: 'camera' | 'gallery') => {
    setAttachMenuOpen(false);
    try {
      const uri = await attach.pickImage(source);
      if (uri) sendWithAttachment(uri, 'photo');
    } catch (e: any) {
      dialog.show({ type: 'error', title: 'Gagal membuka', body: e?.message ?? 'Coba lagi.', primaryText: 'OK' });
    }
  };

  const handleMicPress = async () => {
    if (attach.isRecording) {
      const uri = await attach.stopRecording();
      if (uri) sendWithAttachment(uri, 'audio');
    } else {
      await attach.startRecording();
    }
  };

  const renderItem = ({ item }: { item: ReportMessage }) => {
    const isMe = item.senderId === user?.id;
    const fromStaff = item.senderRole === 'petugas' || item.senderRole === 'admin';

    return (
      <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
        {!isMe && (
          <Text style={styles.senderLabel}>
            {fromStaff ? (item.senderRole === 'admin' ? 'Admin' : 'Petugas') : (item.senderName ?? 'Pelapor')}
          </Text>
        )}

        {item.attachmentType === 'image' && item.attachmentUrl ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPreviewImage(item.attachmentUrl!)}
            style={[styles.imageBubble, isMe && styles.imageBubbleMe]}
          >
            <Image source={{ uri: item.attachmentUrl }} style={styles.imageThumb} />
            {item.message && (
              <Text style={[styles.imageCaption, isMe && styles.imageCaptionMe]}>{item.message}</Text>
            )}
          </TouchableOpacity>
        ) : item.attachmentType === 'audio' && item.attachmentUrl ? (
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, styles.audioBubble]}>
            <ChatAudioPlayer uri={item.attachmentUrl} onTint={isMe ? '#fff' : NAVY} />
          </View>
        ) : (
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.message}</Text>
          </View>
        )}

        <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Chat Petugas</Text>
          {title ? <Text style={styles.headerSub} numberOfLines={1}>{title}</Text> : null}
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={NAVY} /></View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Belum ada pesan</Text>
            <Text style={styles.emptySub}>
              Petugas akan membalas laporanmu di sini. Kamu juga bisa kirim foto atau voice note.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {attach.isRecording && (
        <View style={styles.recordingBar}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>Merekam · {formatDuration(attach.recordingMs)}</Text>
          <TouchableOpacity onPress={() => attach.cancelRecording()} hitSlop={8}>
            <Text style={styles.recCancel}>Batal</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setAttachMenuOpen(true)}
            disabled={sending || attach.isRecording}
            hitSlop={6}
          >
            <Ionicons name="add" size={22} color={NAVY} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={attach.isRecording ? 'Sedang merekam...' : 'Tulis pesan...'}
            placeholderTextColor={SUB}
            multiline
            maxLength={500}
            editable={!sending && !attach.isRecording}
          />

          {input.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendText} disabled={sending}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, attach.isRecording && styles.sendBtnRec]}
              onPress={handleMicPress}
              disabled={sending}
            >
              <Ionicons name={attach.isRecording ? 'stop' : 'mic'} size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Attach menu — inline overlay (not a Modal) to avoid iOS picker conflict */}
      {attachMenuOpen && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={() => setAttachMenuOpen(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={[styles.attachSheet, { paddingBottom: insets.bottom + 18 }]}>
            <TouchableOpacity style={styles.attachItem} onPress={() => handleAttachPhoto('camera')}>
              <View style={[styles.attachIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="camera" size={20} color="#1D4ED8" />
              </View>
              <View>
                <Text style={styles.attachTitle}>Kamera</Text>
                <Text style={styles.attachSub}>Ambil foto langsung</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.attachDivider} />
            <TouchableOpacity style={styles.attachItem} onPress={() => handleAttachPhoto('gallery')}>
              <View style={[styles.attachIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="image" size={20} color="#15803D" />
              </View>
              <View>
                <Text style={styles.attachTitle}>Galeri</Text>
                <Text style={styles.attachSub}>Pilih foto dari galeri</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image preview */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewImage(null)}>
          {previewImage && <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />}
          <View style={[styles.previewClose, { top: insets.top + 12 }]}>
            <Ionicons name="close" size={28} color="#fff" />
          </View>
        </Pressable>
      </Modal>
      <dialog.Dialog />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2, fontWeight: '600' },

  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },

  list: { padding: 16, gap: 6 },
  row: { marginBottom: 8, maxWidth: '82%' },
  rowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderLabel: { fontSize: 11, fontWeight: '700', color: NAVY, marginBottom: 3, marginLeft: 4 },

  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleMe: { backgroundColor: NAVY, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  audioBubble: { paddingHorizontal: 12, paddingVertical: 10, minWidth: 200 },

  imageBubble: {
    backgroundColor: '#fff', borderRadius: 16, borderBottomLeftRadius: 4,
    overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB',
    maxWidth: 240,
  },
  imageBubbleMe: { borderBottomLeftRadius: 16, borderBottomRightRadius: 4, backgroundColor: NAVY, borderColor: NAVY },
  imageThumb: { width: 240, height: 180 },
  imageCaption: { fontSize: 13, color: TEXT, paddingHorizontal: 10, paddingVertical: 8 },
  imageCaptionMe: { color: '#fff' },

  time: { fontSize: 10, color: '#9CA3AF', marginTop: 3, fontWeight: '600' },
  timeMe: { marginRight: 4 },
  timeOther: { marginLeft: 4 },

  recordingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FECACA',
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' },
  recText: { flex: 1, fontSize: 13, color: '#991B1B', fontWeight: '700' },
  recCancel: { fontSize: 12, color: '#991B1B', fontWeight: '800', textDecorationLine: 'underline' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 10, paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, backgroundColor: '#F3F4F6',
    borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14, color: '#111827', maxHeight: 100,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  sendBtnRec: { backgroundColor: '#DC2626' },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  attachSheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 18,
  },
  attachItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  attachIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  attachTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  attachSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  attachDivider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 56 },

  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  previewClose: { position: 'absolute', right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
