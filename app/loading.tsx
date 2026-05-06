import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  const router = useRouter();
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    // Navigate to Main Screen after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="shield-cross" size={80} color="#FFFFFF" />
              <Text style={styles.logoText}>AEGIS CALL</Text>
            </View>
          </View>

          <View style={styles.animationContainer}>
            <Animated.View style={[styles.pulseRingOuter, animatedStyle]}>
              <View style={styles.pulseRingMiddle}>
                <View style={styles.pulseRingInner}>
                  <Text style={styles.dotsText}>....</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoBox: {
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: '#003B71',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: 1,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  pulseRingOuter: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    borderWidth: 2,
    borderColor: '#003B71',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRingMiddle: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: width * 0.225,
    borderWidth: 2,
    borderColor: '#003B71',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRingInner: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderWidth: 2,
    borderColor: '#003B71',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003B71',
    letterSpacing: 4,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#8D8E8E',
    fontWeight: '600',
  },
});
