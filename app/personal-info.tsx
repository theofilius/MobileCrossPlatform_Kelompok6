import React, { useState, useContext } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { useCamera } from '../hooks/useCamera';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateUser } = useContext(AuthContext);
  const { t } = useLanguage();
  const { capturePhoto, pickFromGallery } = useCamera();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(user?.photoUri);

  const handlePickPhoto = () => {
    Alert.alert(
      t('pi_change_photo'),
      t('pi_photo_source'),
      [
        {
          text: t('pi_photo_camera'),
          onPress: async () => {
            const uri = await capturePhoto();
            if (uri) {
              setPhotoUri(uri);
              updateUser({ photoUri: uri });
            }
          },
        },
        {
          text: t('pi_photo_gallery'),
          onPress: async () => {
            const uri = await pickFromGallery();
            if (uri) {
              setPhotoUri(uri);
              updateUser({ photoUri: uri });
            }
          },
        },
        { text: t('ec_cancel'), style: 'cancel' },
      ],
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('!', t('pi_val_name'));
      return;
    }
    updateUser({ name: name.trim(), phone: phone.trim(), email: email.trim(), photoUri });
    Alert.alert(t('pi_success_title'), t('pi_success'), [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Header with Back */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#003B71" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('pi_title')}</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarContainer} onPress={handlePickPhoto} activeOpacity={0.8}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={50} color="#003B71" />
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickPhoto}>
                <Text style={styles.changePhotoText}>{t('pi_change_photo')}</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.label}>{t('pi_name')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('signup_name')}
                placeholderTextColor="#8D8E8E"
              />

              <Text style={styles.label}>{t('pi_phone')}</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('signup_phone')}
                placeholderTextColor="#8D8E8E"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>{t('pi_email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('signup_email')}
                placeholderTextColor="#8D8E8E"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{t('pi_save')}</Text>
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
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003B71',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#003B71',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#003B71',
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003B71',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#003B71',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#003B71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
