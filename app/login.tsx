import { AuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { validateEmail } from '@/utils/auth';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useContext(AuthContext);
  const { t, language, setLanguage } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit =
    !submitting && !googleLoading &&
    email.trim().length > 0 &&
    password.length > 0;

  const handleLogin = async () => {
    setErrorMessage(null);

    const v = validateEmail(email);
    if (!v.ok) { setErrorMessage(v.error); return; }
    if (!password) { setErrorMessage('Kata sandi tidak boleh kosong.'); return; }

    setSubmitting(true);
    const result = await signIn(v.value, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    // onAuthStateChange + AuthGate routes us to home.
  };

  const handleGoogle = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (!result.ok && !result.canceled) setErrorMessage(result.error);
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

            <TouchableOpacity style={styles.langToggle} onPress={toggleLang}>
              <Ionicons name="language" size={14} color="#003B71" />
              <Text style={styles.langToggleText}>{language === 'id' ? 'ID' : 'EN'}</Text>
            </TouchableOpacity>

            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/images/aegislogo-nobg.webp')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>{t('login_title')}</Text>
              <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder={language === 'id' ? 'Alamat email' : 'Email address'}
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
                placeholder={language === 'id' ? 'Kata sandi' : 'Password'}
                placeholderTextColor="#8D8E8E"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorMessage(null); }}
                editable={!submitting && !googleLoading}
              />

              <TouchableOpacity 
                style={{ alignSelf: 'flex-end', marginTop: 8, marginBottom: 16 }}
                onPress={() => router.push('/forgot-password' as any)}
              >
                <Text style={{ color: '#003B71', fontSize: 14, fontWeight: '600' }}>
                  Lupa Kata Sandi?
                </Text>
              </TouchableOpacity>

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
                <TouchableOpacity style={styles.createAccountButton} disabled={submitting || googleLoading}>
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
    paddingTop: 24,
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
  langToggleText: { fontSize: 12, fontWeight: '800', color: '#003B71', letterSpacing: 0.5 },
  logoWrap: { alignItems: 'center', marginTop: 16, marginBottom: 4 },
  logo: { width: 96, height: 96 },
  header: { alignItems: 'center', marginBottom: 24 },
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
  loginButton: {
    backgroundColor: '#003B71',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  loginButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  createAccountButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#003B71',
    marginBottom: 24,
  },
  createAccountText: { color: '#003B71', fontSize: 15, fontWeight: '700' },
  socialSection: { marginTop: 'auto' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: '#D1D5DB' },
  dividerText: { marginHorizontal: 14, color: '#003B71', fontSize: 13, fontWeight: '600' },
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
