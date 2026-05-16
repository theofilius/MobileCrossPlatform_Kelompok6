import { AntDesign, FontAwesome5, Ionicons } from '@expo/vector-icons';
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
import { AuthContext } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useContext(AuthContext);
  const { t, language } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const canSubmit =
    !submitting &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;

  const handleSubmit = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!name.trim()) { setErrorMessage(t('val_name')); return; }
    if (!email.trim()) { setErrorMessage(t('val_email')); return; }
    if (!phone.trim()) { setErrorMessage(t('val_phone')); return; }
    if (!password.trim()) { setErrorMessage(t('val_password')); return; }
    if (password !== confirmPassword) { setErrorMessage(t('val_confirm')); return; }
    if (password.length < 6) {
      setErrorMessage(language === 'id' ? 'Kata sandi minimal 6 karakter.' : 'Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const result = await signUp({ email, password, name, phone });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      // Email confirmation is enabled in Supabase project settings.
      setInfoMessage(
        language === 'id'
          ? 'Akun berhasil dibuat. Periksa email kamu untuk konfirmasi sebelum masuk.'
          : 'Account created. Please check your email to confirm before signing in.',
      );
      setTimeout(() => router.replace('/login' as any), 2500);
      return;
    }

    // Session created → route guard will redirect to home automatically
    setInfoMessage(language === 'id' ? 'Pendaftaran berhasil!' : 'Sign up successful!');
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
              <Text style={styles.subtitle}>{t('signup_subtitle')}</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder={t('signup_name')}
                placeholderTextColor="#8D8E8E"
                value={name}
                onChangeText={(v) => { setName(v); setErrorMessage(null); }}
                editable={!submitting}
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
                editable={!submitting}
              />
              <TextInput
                style={styles.input}
                placeholder={t('signup_phone')}
                placeholderTextColor="#8D8E8E"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(v) => { setPhone(v); setErrorMessage(null); }}
                editable={!submitting}
              />
              <TextInput
                style={styles.input}
                placeholder={t('signup_password')}
                placeholderTextColor="#8D8E8E"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorMessage(null); }}
                editable={!submitting}
              />
              <TextInput
                style={styles.input}
                placeholder={t('signup_confirm')}
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

              {infoMessage && (
                <View style={styles.infoBox}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.infoText}>{infoMessage}</Text>
                </View>
              )}

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
                <TouchableOpacity style={styles.loginLinkButton} disabled={submitting}>
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

              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialIcon} disabled={submitting}>
                  <AntDesign name="google" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon} disabled={submitting}>
                  <FontAwesome5 name="facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon} disabled={submitting}>
                  <AntDesign name="apple" size={24} color="#000" />
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#003B71', marginBottom: 10 },
  subtitle: { fontSize: 14, fontWeight: '500', color: '#4A6B8A', textAlign: 'center', lineHeight: 20 },
  form: { flex: 1 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 52,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 18 },
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
  loginLinkButton: { height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  loginLinkText: { color: '#003B71', fontSize: 14, fontWeight: '600' },
  socialSection: { marginTop: 'auto' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#D1D5DB' },
  dividerText: { marginHorizontal: 14, color: '#6B7280', fontSize: 13, fontWeight: '500' },
  socialButtons: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
