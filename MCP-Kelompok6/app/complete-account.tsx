import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function CompleteAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [phone, setPhone] = useState('');

  const handleSignUp = () => {
    if (!phone.trim()) {
      Alert.alert('Validation', 'Please enter your phone number.');
      return;
    }
    // Navigate to OTP screen with captured data
    router.push({
      pathname: '/otp',
      params: { name: params.name, phone }
    } as any);
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <Text style={styles.title}>Complete Account</Text>
              <Text style={styles.subtitle}>Create an account so you can explore all the{'\n'}existing jobs</Text>
            </View>

            <View style={styles.form}>
              <TextInput 
                style={styles.input} 
                placeholder="Phone Number" 
                placeholderTextColor="#8D8E8E"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
                <Text style={styles.signupButtonText}>Sign up</Text>
              </TouchableOpacity>
            </View>
            
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 120, // push it down a bit like in the design
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#003B71',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#003B71',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signupButton: {
    backgroundColor: '#003B71',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
