import React, { useState, useContext } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCamera } from '../hooks/useCamera';
import { uploadAvatar } from '../services/mediaService';
import { useDialog } from '../components/aegis/Dialog';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateUser } = useContext(AuthContext);
  const { t } = useLanguage();
  const { capturePhoto, pickFromGallery } = useCamera();
  const dialog = useDialog();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(user?.photoUri);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Pick → optimistic local preview → upload to Storage → persist public URL.
  // On error: revert to the previous photo and let the user retry.
  const handlePickedPhoto = async (localUri: string) => {
    if (!user) return;
    const previous = photoUri;
    setPhotoUri(localUri);
    setUploadingPhoto(true);
    try {
      const publicUrl = await uploadAvatar(localUri, user.id);
      setPhotoUri(publicUrl);
      await updateUser({ photoUri: publicUrl });
    } catch (err: any) {
      console.warn('[avatar] upload failed', err?.message ?? err);
      setPhotoUri(previous);
      dialog.show({
        type: 'error',
        title: 'Gagal',
        body: 'Tidak dapat mengunggah foto. Cek koneksi lalu coba lagi.',
        primaryText: 'OK',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePickPhoto = () => {
    if (uploadingPhoto) return;
    dialog.show({
      type: 'info',
      title: t('pi_change_photo'),
      body: t('pi_photo_source'),
      primaryText: t('pi_photo_camera'),
      secondaryText: t('pi_photo_gallery'),
      onPrimary: async () => {
        const uri = await capturePhoto();
        if (uri) handlePickedPhoto(uri);
      },
      onSecondary: async () => {
        const uri = await pickFromGallery();
        if (uri) handlePickedPhoto(uri);
      }
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      dialog.show({
        type: 'error',
        title: '!',
        body: t('pi_val_name'),
        primaryText: 'OK'
      });
      return;
    }
    if (uploadingPhoto) {
      dialog.show({
        type: 'info',
        title: 'Tunggu sebentar',
        body: 'Foto profil sedang diunggah. Coba lagi setelah selesai.',
        primaryText: 'OK',
      });
      return;
    }
    // Don't overwrite photo_uri with a local file:// URI — handlePickedPhoto
    // already persisted the public Storage URL. Only patch the text fields.
    await updateUser({ name: name.trim(), phone: phone.trim(), email: email.trim() });
    dialog.show({
      type: 'success',
      title: t('pi_success_title'),
      body: t('pi_success'),
      primaryText: 'OK',
      onPrimary: () => router.back()
    });
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
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handlePickPhoto}
                activeOpacity={0.8}
                disabled={uploadingPhoto}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={50} color="#003B71" />
                )}
                {uploadingPhoto && (
                  <View style={styles.avatarUploadOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.changePhotoButton, uploadingPhoto && { opacity: 0.6 }]}
                onPress={handlePickPhoto}
                disabled={uploadingPhoto}
              >
                <Text style={styles.changePhotoText}>
                  {uploadingPhoto ? 'Mengunggah...' : t('pi_change_photo')}
                </Text>
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
      <dialog.Dialog />
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
  avatarUploadOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
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
