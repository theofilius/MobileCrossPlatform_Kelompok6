import { supabase } from '@/services/supabase';
import { validateEmail } from '@/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendOTP = async () => {
    setErrorMessage(null);

    // Validasi format email menggunakan fungsi yang sudah kita buat sebelumnya
    const emailRes = validateEmail(email);
    if (!emailRes.ok) { 
      setErrorMessage(emailRes.error); 
      return; 
    }

    setSubmitting(true);
    
    // Meminta Supabase mengirimkan OTP untuk Reset Password
    const { error } = await supabase.auth.resetPasswordForEmail(emailRes.value);
    
    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    // Jika sukses terkirim, arahkan ke halaman input password baru
    // Kita bawa data email-nya sebagai parameter
    router.push({
      pathname: '/reset-password' as any,
      params: { email: emailRes.value },
    });
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* Tombol Back */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#003B71" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Lupa Kata Sandi</Text>
              <Text style={styles.subtitle}>
                Masukkan email yang terdaftar. Kami akan mengirimkan 6 digit kode OTP untuk mengatur ulang kata sandi Anda.
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Masukkan email Anda"
                placeholderTextColor="#8D8E8E"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrorMessage(null); }}
                editable={!submitting}
              />

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.nextButton, (!email || submitting) && styles.nextButtonDisabled]}
                onPress={handleSendOTP}
                disabled={!email || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextButtonText}>Kirim Kode OTP</Text>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 20, paddingBottom: 40 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#003B71', marginBottom: 10 },
  subtitle: { fontSize: 14, fontWeight: '500', color: '#4A6B8A', lineHeight: 20 },
  form: { flex: 1 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 8, marginBottom: 16,
    paddingHorizontal: 16, height: 50, fontSize: 15, color: '#000000',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 18 },
  nextButton: {
    backgroundColor: '#003B71', borderRadius: 10, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#003B71', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  nextButtonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  nextButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});