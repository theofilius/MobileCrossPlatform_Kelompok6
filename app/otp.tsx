import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
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
import { AuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { isValidOtp, OTP_LENGTH } from '@/utils/auth';

const RESEND_COOLDOWN_SECONDS = 60;

export default function OTPScreen() {
  const router = useRouter();
  const { verifyEmailOtp, resendSignupOtp } = useContext(AuthContext);
  const { language } = useLanguage();

  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').toString();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputs = useRef<Array<TextInput | null>>([]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Defensive: if we landed on this screen without an email, push the user back.
  useEffect(() => {
    if (!email) router.replace('/login' as any);
  }, [email, router]);

  const token = digits.join('');
  const canVerify = !verifying && isValidOtp(token);

  const handleDigit = (raw: string, index: number) => {
    // Allow paste of full code (e.g. from clipboard).
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < OTP_LENGTH; i++) next[i] = cleaned[i] ?? '';
      setDigits(next);
      const focusAt = Math.min(cleaned.length, OTP_LENGTH - 1);
      inputs.current[focusAt]?.focus();
      setErrorMessage(null);
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    setErrorMessage(null);
    if (cleaned && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    if (!isValidOtp(token)) {
      setErrorMessage(language === 'id' ? 'Kode harus 6 digit angka.' : 'Code must be 6 digits.');
      return;
    }
    setVerifying(true);
    const result = await verifyEmailOtp(email, token);
    setVerifying(false);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    // AuthGate observes onAuthStateChange and routes us to the right home.
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setResending(true);
    const result = await resendSignupOtp(email);
    setResending(false);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setInfoMessage(
      language === 'id'
        ? 'Kode baru sudah dikirim ke email kamu.'
        : 'A new code has been sent to your email.',
    );
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#003B71" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>
                {language === 'id' ? 'Verifikasi Email' : 'Verify Email'}
              </Text>
              <Text style={styles.subtitle}>
                {language === 'id'
                  ? 'Masukkan 6 digit kode yang dikirim ke'
                  : 'Enter the 6-digit code sent to'}
                {'\n'}
                <Text style={styles.subtitleStrong}>{email}</Text>
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.otpRow}>
                {digits.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { inputs.current[i] = ref; }}
                    style={styles.otpInput}
                    value={d}
                    onChangeText={(v) => handleDigit(v, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={i === 0 ? OTP_LENGTH : 1}
                    selectTextOnFocus
                    autoFocus={i === 0}
                    editable={!verifying}
                  />
                ))}
              </View>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {infoMessage && !errorMessage && (
                <View style={styles.infoBox}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.infoText}>{infoMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.verifyButton, !canVerify && styles.verifyButtonDisabled]}
                onPress={handleVerify}
                disabled={!canVerify}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {language === 'id' ? 'Verifikasi' : 'Verify'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>
                  {language === 'id' ? 'Tidak menerima kode?' : "Didn't get the code?"}
                </Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={cooldown > 0 || resending}
                  style={styles.resendButton}
                >
                  {resending ? (
                    <ActivityIndicator color="#003B71" size="small" />
                  ) : (
                    <Text style={[styles.resendText, (cooldown > 0) && styles.resendTextDisabled]}>
                      {cooldown > 0
                        ? (language === 'id' ? `Kirim ulang (${cooldown}s)` : `Resend (${cooldown}s)`)
                        : (language === 'id' ? 'Kirim ulang' : 'Resend')}
                    </Text>
                  )}
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40 },
  back: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: '#003B71', marginBottom: 10 },
  subtitle: { fontSize: 14, fontWeight: '500', color: '#4A6B8A', textAlign: 'center', lineHeight: 20 },
  subtitleStrong: { fontWeight: '700', color: '#003B71' },
  form: { flex: 1 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#003B71',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 18 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 18 },
  verifyButton: {
    backgroundColor: '#003B71',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  verifyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  resendLabel: { color: '#4A6B8A', fontSize: 13, fontWeight: '500' },
  resendButton: { paddingVertical: 6, paddingHorizontal: 4 },
  resendText: { color: '#003B71', fontSize: 13, fontWeight: '700' },
  resendTextDisabled: { color: '#9CA3AF' },
});
