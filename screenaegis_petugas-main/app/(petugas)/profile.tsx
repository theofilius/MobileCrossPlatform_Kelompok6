import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  Image, TouchableOpacity, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const C = {
  navy:  '#1565C0',
  lb:    '#E3F2FD',
  gray:  '#9E9E9E',
  red:   '#F44336',
  green: '#2E7D32',
  bg:    '#F5F7FA',
  white: '#FFFFFF',
};

const RESPONDER = {
  name:        'Manuel Manatap Sianturi',
  serviceType: 'Fire Department',
  icon:        '🚒',
};

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=400&q=80';

export default function ProfileScreen() {
  const [photo, setPhoto] = useState(DEFAULT_PHOTO);

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aktifkan akses galeri di pengaturan HP.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8} style={styles.photoWrap}>
          <Image source={{ uri: photo }} style={styles.photo} />
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✏</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap foto untuk ganti</Text>
        <Text style={styles.name}>{RESPONDER.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{RESPONDER.icon} {RESPONDER.serviceType}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>On Duty</Text>
        </View>
      </View>

      <View style={styles.logoutWrap}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Logout', 'Yakin mau logout?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => {} },
          ])}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  header:        { backgroundColor: C.navy, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  headerTitle:   { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileCard:   { backgroundColor: C.white, margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e8e8e8' },
  photoWrap:     { position: 'relative', marginBottom: 6 },
  photo:         { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: C.navy },
  editBadge:     { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white },
  editBadgeText: { color: '#fff', fontSize: 12 },
  photoHint:     { fontSize: 11, color: C.gray, marginBottom: 14 },
  name:          { fontSize: 20, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 8 },
  roleBadge:     { backgroundColor: C.lb, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 10 },
  roleText:      { color: C.navy, fontSize: 13, fontWeight: '600' },
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  statusText:    { fontSize: 12, color: C.green, fontWeight: '600' },
  logoutWrap:    { paddingHorizontal: 16 },
  logoutBtn:     { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText:    { color: C.red, fontSize: 14, fontWeight: '700' },
});