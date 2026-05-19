import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import {
  ChatMessage,
  getMessages,
  sendMessage,
  subscribeToRoom,
  type ChatAttachmentType,
} from '../services/chatService';
import { uploadToStorage } from '../services/mediaService';
import { useChatAttachments } from '../hooks/useChatAttachments';
import { ChatAudioPlayer } from '../components/aegis/ChatAudioPlayer';
import { useDialog } from '../components/aegis/Dialog';

const ROOM_ID = 'general';
const NAVY = '#003B71';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function ChatBubble({
  msg,
  prevUserId,
  onPressImage,
}: {
  msg: ChatMessage;
  prevUserId?: string;
  onPressImage: (uri: string) => void;
}) {
  const isMe = msg.isMine;
  const showName = !isMe && msg.userId !== prevUserId;

  return (
    <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperOther]}>
      {showName && <Text style={styles.senderName}>{msg.userName}</Text>}

      {msg.attachmentType === 'image' && msg.attachmentUrl ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onPressImage(msg.attachmentUrl!)}
          style={[styles.imageBubble, isMe && styles.imageBubbleMe]}
        >
          <Image source={{ uri: msg.attachmentUrl }} style={styles.imageThumb} />
          {msg.content && (
            <Text style={[styles.imageCaption, isMe && styles.imageCaptionMe]}>{msg.content}</Text>
          )}
        </TouchableOpacity>
      ) : msg.attachmentType === 'audio' && msg.attachmentUrl ? (
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, styles.audioBubble]}>
          <ChatAudioPlayer
            uri={msg.attachmentUrl}
            tint={isMe ? NAVY : '#fff'}
            onTint={isMe ? NAVY : '#fff'}
          />
        </View>
      ) : (
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.content}</Text>
        </View>
      )}

      <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{formatTime(msg.createdAt)}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { isConnected } = useSocket();
  const { t } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const listRef = useRef<FlatList>(null);
  const attach = useChatAttachments();
  const dialog = useDialog();

  useEffect(() => {
    let mounted = true;
    getMessages(ROOM_ID, user?.id)
      .then(rows => { if (mounted) setMessages(rows); })
      .catch(() => { if (mounted) setMessages([]); })
      .finally(() => { if (mounted) setLoading(false); });

    const unsub = subscribeToRoom(ROOM_ID, user?.id, msg => {
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => { mounted = false; unsub(); };
  }, [user?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const senderName = user?.name ?? 'Anda';

  const sendWithAttachment = async (uri: string, kind: 'photo' | 'audio') => {
    if (!user?.id) return;
    setSending(true);
    try {
      const url = await uploadToStorage(uri, kind, user.id);
      await sendMessage({
        roomId: ROOM_ID,
        userId: user.id,
        userName: senderName,
        attachmentUrl: url,
        attachmentType: (kind === 'photo' ? 'image' : 'audio') as ChatAttachmentType,
      });
    } catch (e: any) {
      dialog.show({ type: 'error', title: 'Gagal kirim', body: e?.message ?? 'Coba lagi.', primaryText: 'OK' });
    } finally {
      setSending(false);
    }
  };

  const handleSendText = async () => {
    const text = input.trim();
    if (!text || !user?.id || sending) return;
    setSending(true);
    setInput('');
    try {
      await sendMessage({ roomId: ROOM_ID, userId: user.id, userName: senderName, content: text });
    } catch (e: any) {
      setInput(text);
      dialog.show({ type: 'error', title: 'Gagal kirim', body: e?.message ?? 'Coba lagi.', primaryText: 'OK' });
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

  return (
    <LinearGradient colors={['#1E3A5F', '#003B71']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{t('chat_title')}</Text>
              <View style={styles.onlineRow}>
                <View style={[styles.onlineDot, { backgroundColor: isConnected ? '#34D399' : '#9CA3AF' }]} />
                <Text style={styles.onlineText}>{isConnected ? t('chat_connected') : t('chat_offline')}</Text>
              </View>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Messages */}
          <View style={styles.messagesContainer}>
            {loading ? (
              <View style={styles.emptyChat}>
                <ActivityIndicator color="rgba(255,255,255,0.6)" />
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <ChatBubble
                    msg={item}
                    prevUserId={index > 0 ? messages[index - 1].userId : undefined}
                    onPressImage={setPreviewImage}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyChat}>
                    <Ionicons name="chatbubbles-outline" size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyChatText}>{t('chat_empty')}</Text>
                    <Text style={styles.emptyChatSub}>{t('chat_empty_sub')}</Text>
                  </View>
                }
              />
            )}
          </View>

          {/* Recording bar */}
          {attach.isRecording && (
            <View style={styles.recordingBar}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>Merekam · {formatDuration(attach.recordingMs)}</Text>
              <TouchableOpacity onPress={() => attach.cancelRecording()} hitSlop={8}>
                <Text style={styles.recCancel}>Batal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setAttachMenuOpen(true)}
              disabled={sending || attach.isRecording}
              hitSlop={6}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder={attach.isRecording ? 'Sedang merekam...' : t('chat_placeholder')}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              editable={!sending && !attach.isRecording}
              returnKeyType="send"
              onSubmitEditing={handleSendText}
              blurOnSubmit
            />

            {input.trim() ? (
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendText}
                disabled={sending}
              >
                <Ionicons name="send" size={18} color={NAVY} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, attach.isRecording && styles.sendBtnRec]}
                onPress={handleMicPress}
                disabled={sending}
              >
                <Ionicons
                  name={attach.isRecording ? 'stop' : 'mic'}
                  size={18}
                  color={attach.isRecording ? '#FFFFFF' : NAVY}
                />
              </TouchableOpacity>
            )}
          </View>

        </KeyboardAvoidingView>

        {/* Attach menu — inline overlay, not a Modal */}
        {attachMenuOpen && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={() => setAttachMenuOpen(false)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.attachSheet}>
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
            <View style={styles.previewClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
      <dialog.Dialog />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  messagesContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  messagesList: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },

  bubbleWrapper: { marginBottom: 6, maxWidth: '80%' },
  bubbleWrapperMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapperOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 3, marginLeft: 4 },

  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, gap: 3 },
  bubbleMe: { backgroundColor: '#FFFFFF', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: 'rgba(255,255,255,0.12)', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: 'rgba(255,255,255,0.92)', lineHeight: 20 },
  bubbleTextMe: { color: NAVY },
  audioBubble: { minWidth: 200, paddingHorizontal: 10, paddingVertical: 10 },

  imageBubble: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, borderBottomLeftRadius: 4,
    overflow: 'hidden', maxWidth: 240,
  },
  imageBubbleMe: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  imageThumb: { width: 240, height: 180 },
  imageCaption: { fontSize: 13, color: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 8 },
  imageCaptionMe: { color: NAVY },

  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.5)' },

  emptyChat: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyChatText: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  emptyChatSub: { fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },

  recordingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(220,38,38,0.18)',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(220,38,38,0.35)',
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FCA5A5' },
  recText: { flex: 1, fontSize: 13, color: '#FCA5A5', fontWeight: '700' },
  recCancel: { fontSize: 12, color: '#FCA5A5', fontWeight: '800', textDecorationLine: 'underline' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 12, gap: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnRec: { backgroundColor: '#DC2626' },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  attachSheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 18,
  },
  attachItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  attachIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  attachTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  attachSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  attachDivider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 56 },

  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  previewClose: { position: 'absolute', top: 40, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
