import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrasi } from '../src/db/skema';
import { TemaProvider, useTema } from '../src/theme/tema';

function Isi() {
  const { warna, gelap } = useTema();
  return (
    <>
      <StatusBar style={gelap ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: warna.aksen },
          headerTintColor: '#FFFFFF',
          contentStyle: { backgroundColor: warna.latar },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tambah" options={{ title: 'Tambah Entri' }} />
        <Stack.Screen name="pengaturan" options={{ title: 'Pengaturan' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="jejaka.db" onInit={migrasi}>
      <TemaProvider>
        <Isi />
      </TemaProvider>
    </SQLiteProvider>
  );
}
