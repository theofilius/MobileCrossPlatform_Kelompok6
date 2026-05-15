import React, { useContext } from 'react';
import { Alert, Image, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const { t, language, setLanguage } = useLanguage();

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  const handlePickLanguage = () => {
    Alert.alert(
      t('lang_pick_title'),
      undefined,
      [
        { text: 'Bahasa Indonesia' + (language === 'id' ? '  ✓' : ''), onPress: () => setLanguage('id') },
        { text: 'English' + (language === 'en' ? '  ✓' : ''), onPress: () => setLanguage('en') },
        { text: t('report_cancel'), style: 'cancel' },
      ],
    );
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Profile Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => router.push('/personal-info' as any)}
              activeOpacity={0.85}
            >
              {user?.photoUri ? (
                <Image source={{ uri: user.photoUri }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={50} color="#003B71" />
              )}
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '-'}</Text>
          </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>{t('profile_settings')}</Text>

            <MenuOption
              icon="account-outline"
              title={t('profile_personal')}
              onPress={() => router.push('/personal-info' as any)}
            />
            <MenuOption
              icon="clipboard-list-outline"
              title={t('profile_history')}
              onPress={() => router.push('/report-history' as any)}
            />
            <MenuOption
              icon="contacts-outline"
              title={t('profile_contacts')}
              iconColor="#EF4444"
              onPress={() => router.push('/emergency-contacts' as any)}
            />
            <MenuOption
              icon="bell-outline"
              title={t('profile_notif')}
              onPress={() => router.push('/notifications' as any)}
            />
            <MenuOption
              icon="shield-outline"
              title={t('profile_privacy')}
              onPress={() => router.push('/privacy-security' as any)}
            />
            <MenuOption
              icon="translate"
              title={t('profile_language')}
              onPress={handlePickLanguage}
              rightLabel={language === 'id' ? 'ID' : 'EN'}
            />
            <MenuOption
              icon="help-circle-outline"
              title={t('profile_help')}
              onPress={() => router.push('/help-support' as any)}
            />
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>{t('profile_logout')}</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Reusable component for menu items
function MenuOption({ icon, title, onPress, iconColor = "#003B71", rightLabel }: { icon: any, title: string, onPress?: () => void, iconColor?: string, rightLabel?: string }) {
  return (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={styles.menuOptionLeft}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        <Text style={styles.menuOptionText}>{title}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {rightLabel && (
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#003B71', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            {rightLabel}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={20} color="#C1C1C1" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#003B71',
  },
  userPhone: {
    fontSize: 14,
    color: '#8D8E8E',
    marginTop: 4,
  },
  menuContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003B71',
    marginBottom: 16,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
});
