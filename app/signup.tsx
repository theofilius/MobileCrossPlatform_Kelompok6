import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
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
import { validateEmail, validateName, validatePassword, validatePhone } from '@/utils/auth';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useContext(AuthContext);
  const { t, language } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit =
    !submitting && !googleLoading &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    acceptedTerms;

  const handleSubmit = async () => {
    setErrorMessage(null);

    const nameRes = validateName(name);
    if (!nameRes.ok) { setErrorMessage(nameRes.error); return; }

    const emailRes = validateEmail(email);
    if (!emailRes.ok) { setErrorMessage(emailRes.error); return; }

    const phoneRes = validatePhone(phone);
    if (!phoneRes.ok) { setErrorMessage(phoneRes.error); return; }

    const pwRes = validatePassword(password);
    if (!pwRes.ok) { setErrorMessage(pwRes.error); return; }

    if (password !== confirmPassword) {
      setErrorMessage(language === 'id' ? 'Konfirmasi kata sandi tidak cocok.' : 'Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    const result = await signUp({
      email: emailRes.value,
      password: pwRes.value,
      name: nameRes.value,
      phone: phoneRes.value,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      router.push({
        pathname: '/otp' as any,
        params: { email: emailRes.value },
      });
      return;
    }
    // Confirmation disabled in Supabase → session is already live → AuthGate routes.
  };

  const handleGoogle = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (!result.ok && !result.canceled) setErrorMessage(result.error);
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <View style={styles.header}>
              <Text style={styles.title}>{t('signup_title')}</Text>
              <Text style={styles.subtitle}>
                {language === 'id'
                  ? 'Buat akun dengan email + kata sandi. Verifikasi email lewat kode 6 digit.'
                  : 'Create an account with email + password. Verify your email with a 6-digit code.'}
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder={t('signup_name')}
                placeholderTextColor="#8D8E8E"
                value={name}
                onChangeText={(v) => { setName(v); setErrorMessage(null); }}
                editable={!submitting && !googleLoading}
              />
              <TextInput
                style={styles.input}
                placeholder={t('signup_email')}
                placeholderTextColor="#8D8E8E"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(v) => { setEmail(v); setErrorMessage(null); }}
                editable={!submitting && !googleLoading}
              />
              <TextInput
                style={styles.input}
                placeholder={language === 'id' ? 'No. HP (mis. 0812xxx atau +62812xxx)' : 'Phone (e.g. +62812xxx)'}
                placeholderTextColor="#8D8E8E"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(v) => { setPhone(v); setErrorMessage(null); }}
                editable={!submitting && !googleLoading}
              />
              <TextInput
                style={styles.input}
                placeholder={language === 'id' ? 'Kata sandi (min. 6 karakter)' : 'Password (min. 6 chars)'}
                placeholderTextColor="#8D8E8E"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorMessage(null); }}
                editable={!submitting && !googleLoading}
              />
              <TextInput
                style={styles.input}
                placeholder={language === 'id' ? 'Ulangi kata sandi' : 'Confirm password'}
                placeholderTextColor="#8D8E8E"
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErrorMessage(null); }}
                editable={!submitting && !googleLoading}
              />

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* UU ITE disclaimer — required to enable submit. Acts as both
                  legal cover and psychological deterrent against prank reports. */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAcceptedTerms(v => !v)}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.termsText}>
                  Saya memahami bahwa melakukan laporan darurat palsu dapat dikenakan sanksi sesuai{' '}
                  <Text style={styles.termsHighlight}>UU ITE Pasal 14</Text> (penjara maksimal 10 tahun dan/atau denda 50 juta rupiah).
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextButton, !canSubmit && styles.nextButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextButtonText}>{t('signup_continue')}</Text>
                )}
              </TouchableOpacity>

              <Link href="/login" asChild>
                <TouchableOpacity style={styles.loginLinkButton} disabled={submitting || googleLoading}>
                  <Text style={styles.loginLinkText}>{t('signup_have_account')} {t('signup_login')}</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.socialSection}>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('login_or')}</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, (submitting || googleLoading) && styles.googleButtonDisabled]}
                onPress={handleGoogle}
                disabled={submitting || googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#003B71" />
                ) : (
                  <>
                    <AntDesign name="google" size={20} color="#003B71" />
                    <Text style={styles.googleButtonText}>
                      {language === 'id' ? 'Lanjutkan dengan Google' : 'Continue with Google'}
                    </Text>
                  </>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#003B71', marginBottom: 10 },
  subtitle: { fontSize: 14, fontWeight: '500', color: '#4A6B8A', textAlign: 'center', lineHeight: 20 },
  form: { flex: 1 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    marginBottom: 10,
  },
  errorText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 18 },
  termsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 4, marginBottom: 10,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#9CA3AF',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#003B71', borderColor: '#003B71' },
  termsText: { flex: 1, fontSize: 11.5, color: '#4B5563', lineHeight: 16 },
  termsHighlight: { color: '#DC2626', fontWeight: '700' },
  nextButton: {
    backgroundColor: '#003B71',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  nextButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  loginLinkButton: { height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  loginLinkText: { color: '#003B71', fontSize: 14, fontWeight: '600' },
  socialSection: { marginTop: 'auto' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: '#D1D5DB' },
  dividerText: { marginHorizontal: 14, color: '#6B7280', fontSize: 13, fontWeight: '500' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#003B71',
    backgroundColor: '#FFFFFF',
  },
  googleButtonDisabled: { opacity: 0.6 },
  googleButtonText: { color: '#003B71', fontSize: 15, fontWeight: '700' },
});
