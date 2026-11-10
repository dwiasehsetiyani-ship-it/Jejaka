import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { useTema } from '../../src/theme/tema';

export default function TabLayout() {
  const { warna } = useTema();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: warna.aksen },
        headerTintColor: '#FFFFFF',
        tabBarActiveTintColor: warna.aksen,
        tabBarInactiveTintColor: warna.teksRedup,
        tabBarStyle: { backgroundColor: warna.kartu, borderTopColor: warna.garis },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jurnal',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
          headerRight: () => (
            <Link href="/pengaturan" asChild>
              <Pressable style={{ marginRight: 16 }}>
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="peta"
        options={{
          title: 'Peta',
          tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, size }) => <Ionicons name="star-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistik"
        options={{
          title: 'Statistik',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
