import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// NOTE: This OTP screen is currently NOT part of the signup flow.
// Signup now uses Supabase Auth (email + password) and email confirmation
// is handled via the link Supabase sends. This screen is kept as a placeholder
// for future phone-OTP integration via supabase.auth.signInWithOtp.

export default function OTPScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    // OTP-based signup is disabled — signup now uses Supabase Auth
    // (email + password). This screen is a placeholder for future phone OTP.
    Alert.alert(
      'OTP belum tersedia',
      'Pendaftaran sekarang menggunakan email dan kata sandi. Silakan masuk dengan akun email kamu.',
      [{ text: 'OK', onPress: () => router.replace('/login' as any) }],
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
            
            <View style={styles.header}>
              <Text style={styles.title}>Verifikasi Identitas</Text>
              <Text style={styles.subtitle}>Kami mengirimkan kode OTP ke nomor kamu.{'\n'}Masukkan 4 digit di bawah ini.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputs.current[index] = ref; }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Konfirmasi</Text>
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
    paddingTop: 120, 
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#003B71',
  },
  confirmButton: {
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
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
