import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import Splash from '../src/components/Splash';
import { isiCuacaTertunda } from '../src/db/entri';
import { migrasi } from '../src/db/skema';
import { FilterProvider } from '../src/filter';
import { TemaProvider, useTema } from '../src/theme/tema';

function Isi() {
  const { warna, gelap } = useTema();
  const db = useSQLiteContext();
  const [splash, setSplash] = useState(true);
  const jalan = useRef(false);

  // Isi cuaca yang masih "menunggu" setiap kali koneksi tersedia.
  useEffect(() => {
    const berhenti = NetInfo.addEventListener((state) => {
      if (!state.isConnected || state.isInternetReachable === false) return;
      if (jalan.current) return;
      jalan.current = true;
      isiCuacaTertunda(db)
        .catch(() => {})
        .finally(() => {
          jalan.current = false;
        });
    });
    return berhenti;
  }, [db]);

  if (splash) {
    return (
      <>
        <StatusBar style="light" />
        <Splash onSelesai={() => setSplash(false)} />
      </>
    );
  }

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
                <Stack.Screen name="tambah-wishlist" options={{ title: 'Tambah Tempat Tujuan' }} />
        <Stack.Screen name="entri/[id]/index" options={{ title: 'Detail Entri' }} />
        <Stack.Screen name="entri/[id]/ubah" options={{ title: 'Ubah Entri' }} />
        <Stack.Screen name="pengaturan" options={{ title: 'Pengaturan' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="jejaka.db" onInit={migrasi}>
      <TemaProvider>
        <FilterProvider>
          <Isi />
        </FilterProvider>
      </TemaProvider>
    </SQLiteProvider>
  );
}