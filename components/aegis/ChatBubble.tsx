import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ChatBubbleProps = {
  content: string;
  time: string;
  isMine: boolean;
  senderName?: string; // shown only when not mine and first in group
};

export function ChatBubble({ content, time, isMine, senderName }: ChatBubbleProps) {
  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperMe : styles.wrapperOther]}>
      {senderName && !isMine && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <View style={[styles.bubble, isMine ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.text, isMine && styles.textMe]}>{content}</Text>
        <Text style={[styles.time, isMine && styles.timeMe]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 6,
    maxWidth: '80%',
  },
  wrapperMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperOther: {
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
  text: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 20,
  },
  textMe: {
    color: '#003B71',
  },
  time: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(0,59,113,0.5)',
  },
});
