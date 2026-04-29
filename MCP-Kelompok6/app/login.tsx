import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  const handleLogin = () => {
    // Navigasi ke halaman home utama (tabs)
    router.replace('/(tabs)');
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
              <Text style={styles.title}>Login here</Text>
              <Text style={styles.subtitle}>Welcome back you've{'\n'}been missed!</Text>
            </View>

            <View style={styles.form}>
              {loginMethod === 'email' ? (
                <>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Email" 
                    placeholderTextColor="#8D8E8E"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Password" 
                    placeholderTextColor="#8D8E8E"
                    secureTextEntry
                  />
                </>
              ) : (
                <TextInput 
                  style={styles.input} 
                  placeholder="Phone Number" 
                  placeholderTextColor="#8D8E8E"
                  keyboardType="phone-pad"
                />
              )}

              <View style={styles.toggleContainer}>
                <TouchableOpacity 
                  style={[styles.toggleButton, loginMethod === 'email' && styles.toggleButtonActive]}
                  onPress={() => setLoginMethod('email')}
                >
                  <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleButton, loginMethod === 'phone' && styles.toggleButtonActive]}
                  onPress={() => setLoginMethod('phone')}
                >
                  <Text style={[styles.toggleText, loginMethod === 'phone' && styles.toggleTextActive]}>Phone Number</Text>
                </TouchableOpacity>
              </View>

              {loginMethod === 'email' && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>{loginMethod === 'email' ? 'Sign in' : 'Next'}</Text>
              </TouchableOpacity>

              <Link href="/signup" asChild>
                <TouchableOpacity style={styles.createAccountButton}>
                  <Text style={styles.createAccountText}>Create new account</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.socialSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>Or login with</Text>
                <View style={styles.divider} />
              </View>
              
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialIcon}>
                  <AntDesign name="google" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <FontAwesome5 name="facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <AntDesign name="apple1" size={24} color="#000" />
                </TouchableOpacity>
              </View>
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
    paddingTop: 60,
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003B71',
    textAlign: 'center',
    lineHeight: 26,
  },
  form: {
    flex: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    padding: 4,
    marginBottom: 16,
    marginTop: 8,
  },
  toggleButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#003B71',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8D8E8E',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#003B71',
    fontSize: 14,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: '#003B71',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createAccountButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#003B71',
    marginBottom: 32,
  },
  createAccountText: {
    color: '#003B71',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialSection: {
    marginTop: 'auto',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#003B71',
    fontSize: 14,
    fontWeight: '600',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
