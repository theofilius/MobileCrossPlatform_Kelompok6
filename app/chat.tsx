import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { useSocket } from './context/SocketContext';
import { ChatMessage, getMessages, sendMessage, subscribeToRoom } from '../services/chatService';

const ROOM_ID = 'general';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function ChatBubble({ msg, prevUserId }: { msg: ChatMessage; prevUserId?: string }) {
  const isMe = msg.isMine;
  const showName = !isMe && msg.userId !== prevUserId;

  return (
    <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperOther]}>
      {showName && (
        <Text style={styles.senderName}>{msg.userName}</Text>
      )}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.content}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{formatTime(msg.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { isConnected } = useSocket();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setMessages(getMessages(ROOM_ID));

    const unsubscribe = subscribeToRoom(ROOM_ID, updated => {
      setMessages([...updated]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    sendMessage(
      ROOM_ID,
      text,
      user?.name ?? 'unknown',
      user?.name ?? 'Anda',
    );
    setInput('');
  }, [input, user]);

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
          </View>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t('chat_placeholder')}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={18} color={input.trim() ? '#003B71' : 'rgba(0,59,113,0.4)'} />
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  messagesContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },

  bubbleWrapper: {
    marginBottom: 6,
    maxWidth: '80%',
  },
  bubbleWrapperMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleWrapperOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    gap: 3,
  },
  bubbleMe: {
    backgroundColor: '#FFFFFF',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: '#003B71',
  },
  bubbleTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    alignSelf: 'flex-end',
  },
  bubbleTimeMe: {
    color: 'rgba(0,59,113,0.5)',
  },

  emptyChat: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  emptyChatSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});