import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Keyboard, TouchableWithoutFeedback, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

const C = {
  secondary:   '#0060aa',   // header & send btn
  primaryCont: '#084b8a',   // petugas bubble
  surfaceHigh: '#E7E8EE',   // reporter bubble
  onSurface:   '#191C20',
  bg:          '#F9F9FF',
  white:       '#FFFFFF',
  outline:     '#727781',
  outlineVar:  '#C2C6D2',
  inputBg:     '#F3F3F9',
};

const SERVICE_CONFIG: Record<string, { icon: string; label: string }> = {
  ambulance:       { icon: '🚑', label: 'Ambulans'          },
  police:          { icon: '🚓', label: 'Polisi'            },
  fire_department: { icon: '🚒', label: 'Pemadam Kebakaran' },
};

const DUMMY_MESSAGES = [
  { id: '1', senderId: 'user',    text: 'Tolong! Ada kecelakaan motor di lampu merah Pasar Baru.',              time: '10:32' },
  { id: '2', senderId: 'petugas', text: 'Halo, kami sudah terima laporan Anda. Kami dalam perjalanan.',         time: '10:33' },
  { id: '3', senderId: 'user',    text: 'Korban masih pingsan, ada pendarahan di kepala.',                      time: '10:33' },
  { id: '4', senderId: 'petugas', text: 'Baik, jangan gerakkan korban. Pastikan jalur napas tetap bebas.',      time: '10:34' },
  { id: '5', senderId: 'user',    text: 'Siap pak! Kapan sampai?',                                              time: '10:34' },
];

function getCurrentTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { reportJson } = useLocalSearchParams<{ reportJson: string }>();
  const report = JSON.parse(reportJson || '{}');
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const svc = SERVICE_CONFIG[report?.type] || SERVICE_CONFIG.ambulance;

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: 'petugas',
      text,
      time: getCurrentTime(),
    }]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.senderId === 'petugas';

    if (isMe) {
      return (
        <View style={styles.rowRight}>
          {/* Bubble + timestamp kiri avatar */}
          <View style={styles.bubbleMeWrapper}>
            <View style={styles.bubbleMe}>
              <Text style={styles.bubbleMeText}>{item.text}</Text>
            </View>
            <Text style={styles.timestampRight}>{item.time}</Text>
          </View>
          {/* Avatar petugas — naik supaya sejajar dengan bagian bawah bubble */}
          <View style={styles.avatarPetugas}>
            <Text style={styles.avatarIcon}>{svc.icon}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.rowLeft}>
        <View style={styles.bubbleThem}>
          <Text style={styles.bubbleThemText}>{item.text}</Text>
        </View>
        <Text style={styles.timestampLeft}>{item.time}</Text>
      </View>
    );
  };

  const inputBarHeight = 72 + insets.bottom;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={C.secondary} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Avatar dengan online indicator */}
        <View style={styles.avatarWrap}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarEmoji}>👤</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>

        {/* Nama & subtitle */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {report?.userName || 'Pelapor'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            REPORTER {'• '}{(report?.location?.address || 'Lokasi').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* ── Chat canvas ── */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.canvas}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messageList,
              { paddingBottom: inputBarHeight + 8 },
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        </View>
      </TouchableWithoutFeedback>

      {/* ── Input bar ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={styles.input}
            placeholder="Balas pesan..."
            placeholderTextColor={C.outline}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? C.secondary : C.outlineVar },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.secondary },

  // ── Header ────────────────────────────────────────────
  header: {
    backgroundColor: C.secondary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn:           { padding: 4 },
  backIcon:          { color: '#fff', fontSize: 26 },
  avatarWrap:        { position: 'relative' },
  headerAvatar:      {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)',
  },
  headerAvatarEmoji: { fontSize: 22 },
  onlineDot:         {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2, borderColor: C.secondary,
  },
  headerInfo:  { flex: 1 },
  headerName:  { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  headerSub:   {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10, fontWeight: '700',
    letterSpacing: 0.9, marginTop: 2,
  },

  // ── Canvas ────────────────────────────────────────────
  canvas:      { flex: 1, backgroundColor: C.bg },
  messageList: { padding: 20 },

  // ── Reporter bubble (left) ────────────────────────────
  rowLeft: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    marginBottom: 20,
  },
  bubbleThem: {
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: '#003465',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  bubbleThemText: { fontSize: 15, color: C.onSurface, lineHeight: 22 },
  timestampLeft:  {
    fontSize: 10, color: C.outline,
    fontWeight: '600', letterSpacing: 0.3,
    marginTop: 5, marginLeft: 4,
  },

  // ── Petugas bubble (right) ────────────────────────────
  rowRight: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleMeWrapper: { flex: 1, alignItems: 'flex-end' },
  bubbleMe: {
    backgroundColor: C.primaryCont,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    shadowColor: '#003465',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  bubbleMeText:   { fontSize: 15, color: '#fff', lineHeight: 22 },
  timestampRight: {
    fontSize: 10, color: C.outline,
    fontWeight: '600', letterSpacing: 0.3,
    marginTop: 5, marginRight: 4,
  },
  avatarPetugas: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.secondary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  avatarIcon: { fontSize: 16 },

  // ── Input bar ─────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: C.outlineVar + '40',
  },
  input: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    maxHeight: 96,
    color: C.onSurface,
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  sendIcon: { color: '#fff', fontSize: 16, marginLeft: 2 },
});
