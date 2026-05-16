import { AntDesign, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useContext(AuthContext);
  const { t, language, setLanguage } = useLanguage();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit =
    !submitting &&
    password.trim().length > 0 &&
    (loginMethod === 'email' ? email.trim().length > 0 : phoneNumber.trim().length > 0);

  const handleLogin = async () => {
    setErrorMessage(null);

    if (loginMethod === 'phone') {
      // Phone+password login is not supported by Supabase out of the box
      // (would require phone OTP setup). Inform the user.
      Alert.alert(
        '!',
        language === 'id'
          ? 'Login dengan nomor telepon belum tersedia. Gunakan email.'
          : 'Phone login is not available yet. Please use email.',
      );
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage(t('login_validation_email'));
      return;
    }

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    // onAuthStateChange will update user, route guard in _layout will redirect.
    // We don't manually navigate here.
  };

  const toggleLang = () => setLanguage(language === 'id' ? 'en' : 'id');

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Language toggle */}
            <TouchableOpacity style={styles.langToggle} onPress={toggleLang}>
              <Ionicons name="language" size={14} color="#003B71" />
              <Text style={styles.langToggleText}>{language === 'id' ? 'ID' : 'EN'}</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>{t('login_title')}</Text>
              <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
            </View>

            <View style={styles.form}>
              {loginMethod === 'email' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={t('login_email_ph')}
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
                    placeholder={t('login_password_ph')}
                    placeholderTextColor="#8D8E8E"
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={(v) => { setPassword(v); setErrorMessage(null); }}
                    editable={!submitting}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={t('login_phone_ph')}
                    placeholderTextColor="#8D8E8E"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={(v) => { setPhoneNumber(v); setErrorMessage(null); }}
                    editable={!submitting}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={t('login_password_ph')}
                    placeholderTextColor="#8D8E8E"
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={(v) => { setPassword(v); setErrorMessage(null); }}
                    editable={!submitting}
                  />
                </>
              )}

              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, loginMethod === 'email' && styles.toggleButtonActive]}
                  onPress={() => { setLoginMethod('email'); setErrorMessage(null); }}
                  disabled={submitting}
                >
                  <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>{t('login_email_tab')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, loginMethod === 'phone' && styles.toggleButtonActive]}
                  onPress={() => { setLoginMethod('phone'); setErrorMessage(null); }}
                  disabled={submitting}
                >
                  <Text style={[styles.toggleText, loginMethod === 'phone' && styles.toggleTextActive]}>{t('login_phone_tab')}</Text>
                </TouchableOpacity>
              </View>

              {loginMethod === 'email' && (
                <TouchableOpacity style={styles.forgotPassword} disabled={submitting}>
                  <Text style={styles.forgotPasswordText}>{t('login_forgot')}</Text>
                </TouchableOpacity>
              )}

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.loginButton, !canSubmit && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>{t('login_btn')}</Text>
                )}
              </TouchableOpacity>

              <Link href="/signup" asChild>
                <TouchableOpacity style={styles.createAccountButton} disabled={submitting}>
                  <Text style={styles.createAccountText}>{t('login_create')}</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  langToggle: {
    position: 'absolute',
    top: 20,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 10,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003B71',
    letterSpacing: 0.5,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#003B71', marginBottom: 16 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#003B71', textAlign: 'center', lineHeight: 26 },
  form: { flex: 1 },
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
  toggleButtonActive: { backgroundColor: '#003B71' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#8D8E8E' },
  toggleTextActive: { color: '#FFFFFF' },
  forgotPassword: { alignSelf: 'flex-start', marginBottom: 16 },
  forgotPasswordText: { color: '#003B71', fontSize: 14, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 18 },
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
  loginButtonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
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
  createAccountText: { color: '#003B71', fontSize: 16, fontWeight: 'bold' },
  socialSection: { marginTop: 'auto' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#D1D5DB' },
  dividerText: { marginHorizontal: 16, color: '#003B71', fontSize: 14, fontWeight: '600' },
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
