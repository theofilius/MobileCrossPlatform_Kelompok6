import { supabase } from '@/services/supabase';
import { validatePassword } from '@/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string; // Menangkap email dari halaman sebelumnya

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = otp.length === 6 && newPassword.length > 0 && confirmPassword.length > 0 && !submitting;

  // reset-password.tsx — handleResetPassword yang diperbaiki

const handleResetPassword = async () => {
  setErrorMessage(null);

  // ── Validasi lokal ──────────────────────────────────────
  const pwRes = validatePassword(newPassword);
  if (!pwRes.ok) {
    setErrorMessage(pwRes.error);
    return;
  }
  if (newPassword !== confirmPassword) {
    setErrorMessage('Konfirmasi kata sandi tidak cocok.');
    return;
  }

  setSubmitting(true);

  try {
    // ── Step 1: Verifikasi OTP ──────────────────────────
    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        email,
        token: otp,
        type:  'recovery',
      });

    if (verifyError || !verifyData?.session) {
      setErrorMessage('Kode OTP salah atau sudah kadaluarsa.');
      return;
    }

    // ── Step 2: Set session secara eksplisit ────────────
    // INI yang fix infinite loop — jangan andalkan auto-storage
    // Langsung inject access_token dan refresh_token dari response
    const { error: sessionError } = await supabase.auth.setSession({
      access_token:  verifyData.session.access_token,
      refresh_token: verifyData.session.refresh_token,
    });

    if (sessionError) {
      setErrorMessage('Gagal membuat sesi. Silakan coba lagi.');
      return;
    }

    // ── Step 3: Update password dengan timeout ──────────
    // Bungkus dengan Promise.race agar tidak bisa infinite loop
    const updateResult = await Promise.race([
      supabase.auth.updateUser({ password: newPassword }),
      new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(
          () => reject(new Error('TIMEOUT')),
          10000 // 10 detik maksimal
        )
      ),
    ]);

    if (updateResult.error) {
      const msg = updateResult.error.message ?? '';
      if (msg.includes('same password')) {
        setErrorMessage(
          'Kata sandi baru tidak boleh sama dengan kata sandi lama.'
        );
      } else {
        setErrorMessage('Gagal memperbarui kata sandi. Coba lagi.');
      }
      return;
    }

    // ── Sukses ───────────────────────────────────────────
    Alert.alert(
      'Berhasil! 🎉',
      'Kata sandi berhasil diperbarui.',
      [{
        text: 'Lanjutkan',
        onPress: () => router.replace('/(tabs)'),
      }]
    );

  } catch (err: any) {
    if (err?.message === 'TIMEOUT') {
      setErrorMessage(
        'Koneksi timeout. Periksa internet Anda dan coba lagi.'
      );
    } else {
      setErrorMessage('Terjadi kesalahan. Coba lagi.');
    }
  } finally {
    // finally SELALU jalan — loading pasti berhenti
    setSubmitting(false);
  }
};

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#003B71" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Atur Ulang Sandi</Text>
              <Text style={styles.subtitle}>
                Kode verifikasi 6 digit telah dikirim ke <Text style={styles.highlight}>{email}</Text>
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Kode OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="000000"
                placeholderTextColor="#8D8E8E"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(v) => { setOtp(v.replace(/[^0-9]/g, '')); setErrorMessage(null); }}
                editable={!submitting}
              />

              <Text style={styles.label}>Kata Sandi Baru</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#8D8E8E"
                secureTextEntry
                autoCapitalize="none"
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setErrorMessage(null); }}
                editable={!submitting}
              />

              <Text style={styles.label}>Konfirmasi Kata Sandi</Text>
              <TextInput
                style={styles.input}
                placeholder="Ulangi kata sandi baru"
                placeholderTextColor="#8D8E8E"
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErrorMessage(null); }}
                editable={!submitting}
              />

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.nextButton, !canSubmit && styles.nextButtonDisabled]}
                onPress={handleResetPassword}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextButtonText}>Ubah Kata Sandi</Text>
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
  highlight: { fontWeight: '700', color: '#003B71' },
  form: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#4A6B8A', marginBottom: 6, marginLeft: 4 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 8, marginBottom: 16,
    paddingHorizontal: 16, height: 50, fontSize: 15, color: '#000000',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  otpInput: { fontSize: 20, letterSpacing: 8, textAlign: 'center', fontWeight: '700' },
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