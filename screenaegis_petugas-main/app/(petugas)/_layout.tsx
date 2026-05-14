import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';

const C = { primary: '#003465', gray: '#9E9E9E' };

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, color: focused ? C.primary : C.gray }}>
      {icon}
    </Text>
  );
}

export default function PetugasLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.primary,
        tabBarInactiveTintColor: C.gray,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: Platform.OS === 'android' ? 62 : 58,
          paddingBottom: Platform.OS === 'android' ? 8 : 4,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ focused }) => <TabIcon icon="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon icon="◉" focused={focused} />,
        }}
      />
      <Tabs.Screen name="detail"   options={{ href: null }} />
      <Tabs.Screen name="navigate" options={{ href: null }} />
      <Tabs.Screen name="chat"     options={{ href: null }} />
    </Tabs>
  );
}
