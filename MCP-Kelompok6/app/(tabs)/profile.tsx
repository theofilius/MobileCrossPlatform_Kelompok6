import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    // Go to login screen explicitly — not '/' which may resolve to tabs
    router.replace('/login' as any);
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Profile Section */}
          <View style={styles.headerSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={50} color="#003B71" />
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '-'}</Text>
          </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            
            <MenuOption 
              icon="account-outline" 
              title="Personal Information" 
              onPress={() => router.push('/personal-info' as any)}
            />
            <MenuOption icon="contacts-outline" title="Emergency Contacts" iconColor="#EF4444" />
            <MenuOption icon="bell-outline" title="Notifications" />
            <MenuOption icon="shield-outline" title="Privacy & Security" />
            <MenuOption icon="help-circle-outline" title="Help & Support" />
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Reusable component for menu items
function MenuOption({ icon, title, onPress, iconColor = "#003B71" }: { icon: any, title: string, onPress?: () => void, iconColor?: string }) {
  return (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={styles.menuOptionLeft}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        <Text style={styles.menuOptionText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C1C1C1" />
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
    paddingBottom: 40,
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
