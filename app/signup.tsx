import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { FontAwesome5, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNext = () => {
    if (!name.trim()) { Alert.alert('!', t('val_name')); return; }
    if (!email.trim()) { Alert.alert('!', t('val_email')); return; }
    if (!phone.trim()) { Alert.alert('!', t('val_phone')); return; }
    if (!password.trim()) { Alert.alert('!', t('val_password')); return; }
    if (password !== confirmPassword) { Alert.alert('!', t('val_confirm')); return; }
    router.push({ pathname: '/otp', params: { name, phone } } as any);
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
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder={t('signup_email')}
                placeholderTextColor="#8D8E8E"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder={t('signup_phone')}
                placeholderTextColor="#8D8E8E"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={styles.input}
                placeholder={t('signup_password')}
                placeholderTextColor="#8D8E8E"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={styles.input}
                placeholder={t('signup_confirm')}
                placeholderTextColor="#8D8E8E"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>{t('signup_continue')}</Text>
              </TouchableOpacity>

              <Link href="/login" asChild>
                <TouchableOpacity style={styles.loginLinkButton}>
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
                <TouchableOpacity style={styles.socialIcon}>
                  <AntDesign name="google" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <FontAwesome5 name="facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#003B71',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A6B8A',
    textAlign: 'center',
    lineHeight: 20,
  },
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
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loginLinkButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loginLinkText: {
    color: '#003B71',
    fontSize: 14,
    fontWeight: '600',
  },
  socialSection: { marginTop: 'auto' },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
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
