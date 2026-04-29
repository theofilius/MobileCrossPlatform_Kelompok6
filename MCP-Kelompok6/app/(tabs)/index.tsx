import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Switch, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const pulse = useSharedValue(1);
  const [isVolunteer, setIsVolunteer] = useState(false);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoPlaceholder}>
                <MaterialCommunityIcons name="shield-cross" size={24} color="#0C4F8D" />
              </View>
              <View>
                <Text style={styles.locationTitle}>Current location</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={12} color="#000" />
                  <Text style={styles.locationText}>Tangerang, Gading Serpong</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <Ionicons name="notifications" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Welcome Banner */}
          <View style={styles.bannerContainer}>
            <Text style={styles.bannerTitle}>Welcome, Lionel Manatap !</Text>
            <View style={styles.bannerContentRow}>
              <View style={styles.bannerTextCol}>
                <Text style={styles.bannerDesc}>
                  Aegis Call is an emergency protection system that will:
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• Send your location to trusted contacts</Text>
                  <Text style={styles.bulletItem}>• Record audio during the emergency situation</Text>
                  <Text style={styles.bulletItem}>• Contact the nearest emergency services</Text>
                  <Text style={styles.bulletItem}>• Provide first aid guidance</Text>
                </View>
              </View>
              <View style={styles.bannerImagePlaceholder}>
                <Ionicons name="people" size={40} color="#8D8E8E" />
              </View>
            </View>
          </View>

          {/* Main SOS Button Card */}
          <View style={styles.emergencyCard}>
            <Text style={styles.emergencyCardTitle}>Emergency Button</Text>
            
            <View style={styles.sosContainer}>
              <View style={styles.pulseRingOuter}>
                <Animated.View style={[styles.pulseRingInner, animatedStyle]}>
                  <TouchableOpacity 
                    style={styles.sosButton}
                    activeOpacity={0.8}
                    onPress={() => alert('Initiating Emergency...')}
                  >
                    <MaterialCommunityIcons name="gesture-tap" size={48} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
            
            <Text style={styles.sosHelperText}>
              Press and hold the button to activate emergency protection. Trusted contacts will automatically receive your location.
            </Text>

            <View style={styles.volunteerContainer}>
              <Text style={styles.volunteerText}>Volunteer for help</Text>
              <Switch 
                value={isVolunteer} 
                onValueChange={setIsVolunteer} 
                trackColor={{ false: '#D1D5DB', true: '#0C4F8D' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>

          {/* Learn More Section */}
          <View style={styles.learnMoreSection}>
            <View style={styles.learnMoreHeader}>
              <Text style={styles.learnMoreTitle}>Pelajari Lebih Lanjut tentang</Text>
              <Ionicons name="arrow-forward" size={16} color="#003B71" />
            </View>
            
            <TouchableOpacity style={styles.pillButton}>
              <Text style={styles.pillButtonText}>Pertolongan pertama</Text>
              <Ionicons name="chevron-forward-circle-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.pillButton}>
              <Text style={styles.pillButtonText}>Bencana Alam</Text>
              <Ionicons name="chevron-forward-circle-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationTitle: {
    fontSize: 10,
    color: '#8D8E8E',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
    marginLeft: 2,
  },
  bellButton: {
    padding: 4,
  },
  bannerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#003B71',
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  bannerDesc: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletItem: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 2,
  },
  bannerImagePlaceholder: {
    width: 80,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emergencyCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
  },
  pulseRingOuter: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    borderWidth: 1,
    borderColor: 'rgba(12, 79, 141, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRingInner: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: width * 0.225,
    backgroundColor: 'rgba(12, 79, 141, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.175,
    backgroundColor: '#0C4F8D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C4F8D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#2571B8',
  },
  sosHelperText: {
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  volunteerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  volunteerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  learnMoreSection: {
    marginTop: 8,
  },
  learnMoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  learnMoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003B71',
    marginRight: 4,
  },
  pillButton: {
    backgroundColor: '#003B71',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 10,
  },
  pillButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
