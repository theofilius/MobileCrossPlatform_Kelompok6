import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export type SOSButtonProps = {
  /** Total hold duration in seconds before activation. Default 3. */
  holdSeconds?: number;
  /** Triggered when user holds long enough. */
  onActivate: () => void;
  /** Diameter ratio of the inner solid button vs screen width. Default 0.27. */
  size?: number;
};

/**
 * Press-and-hold SOS button used on Home.
 * Auto pulses, shows countdown while held, and fires onActivate when complete.
 * If released early, countdown is cancelled.
 */
export function SOSButton({ holdSeconds = 3, onActivate, size = 0.27 }: SOSButtonProps) {
  const pulse = useSharedValue(1);
  const [isHolding, setIsHolding] = useState(false);
  const [count, setCount] = useState(holdSeconds);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const handlePressIn = () => {
    setIsHolding(true);
    setCount(holdSeconds);
    let c = holdSeconds - 1;
    timerRef.current = setInterval(() => {
      setCount(c);
      c -= 1;
    }, 1000);
    timeoutRef.current = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsHolding(false);
      setCount(holdSeconds);
      onActivate();
    }, holdSeconds * 1000);
  };

  const handlePressOut = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHolding(false);
    setCount(holdSeconds);
  };

  const innerSize = width * size;
  const middleSize = width * (size + 0.1);
  const outerSize = width * (size + 0.19);

  return (
    <Animated.View
      style={[
        styles.outer,
        { width: outerSize, height: outerSize, borderRadius: outerSize / 2 },
        isHolding && styles.outerHolding,
      ]}
    >
      <Animated.View
        style={[
          styles.middle,
          { width: middleSize, height: middleSize, borderRadius: middleSize / 2 },
          animatedStyle,
          isHolding && styles.middleHolding,
        ]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.inner,
            { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
            isHolding && styles.innerHolding,
          ]}
        >
          {isHolding ? (
            <Text style={styles.countText}>{count}</Text>
          ) : (
            <MaterialCommunityIcons name="gesture-tap-hold" size={36} color="#FFFFFF" />
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderColor: 'rgba(12,79,141,0.15)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerHolding: {
    borderColor: 'rgba(220,38,38,0.4)',
    borderStyle: 'solid',
    borderWidth: 2,
  },
  middle: {
    backgroundColor: 'rgba(12,79,141,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleHolding: {
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  inner: {
    backgroundColor: '#0C4F8D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C4F8D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#2571B8',
  },
  innerHolding: {
    backgroundColor: '#DC2626',
    borderColor: '#FF4444',
    shadowColor: '#DC2626',
  },
  countText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
