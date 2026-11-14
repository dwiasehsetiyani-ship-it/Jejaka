import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { tambahWishlist } from '../src/db/wishlist';
import { isiTempat, posisiSaatIni, type Titik } from '../src/services/lokasi';
import { useTema } from '../src/theme/tema';

const WILAYAH_AWAL = { latitude: -7.0, longitude: 110.4, latitudeDelta: 3, longitudeDelta: 3 };

export default function TambahWishlist() {
  const { warna } = useTema();
  const db = useSQLiteContext();
  const router = useRouter();
  const net = useNetInfo();
  const online = net.isConnected !== false && net.isInternetReachable !== false;

  const peta = useRef<MapView>(null);
  const manual = useRef({ nama: false, kota: false });
  const [nama, setNama] = useState('');
  const [kota, setKota] = useState('');
  const [titik, setTitik] = useState<Titik | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [izinDitolak, setIzinDitolak] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  async function tandai(t: Titik, geser: boolean) {
    setTitik(t);
    if (geser) {
      peta.current?.animateToRegion({ ...t, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
    }
    setMemuat(true);
    try {
      const tempat = await isiTempat(db, t, online);
      if (!manual.current.nama) setNama(tempat.nama_tempat);
      if (!manual.current.kota) setKota(tempat.kota);
    } catch {}
    setMemuat(false);
  }

  async function pakaiLokasiSaatIni() {
    setMemuat(true);
    const p = await posisiSaatIni();
    if (p.titik) {
      setIzinDitolak(false);
      await tandai(p.titik, true);
    } else {
      setIzinDitolak(p.ditolak);
      setMemuat(false);
      if (!p.ditolak) Alert.alert('Lokasi belum didapat', 'Ketuk peta untuk menandai tempatnya.');
    }
  }

  async function simpan() {
    if (!nama.trim()) {
      Alert.alert('Nama tempat kosong', 'Isi nama tempat dulu sebelum menyimpan.');
      return;
    }
    if (!titik) {
      Alert.alert('Lokasi belum dipilih', 'Ketuk peta untuk menandai tempat, atau pakai lokasi saat ini.');
      return;
    }
    setMenyimpan(true);
    try {
      await tambahWishlist(db, {
        nama_tempat: nama.trim(),
        kota: kota.trim(),
        latitude: titik.latitude,
        longitude: titik.longitude,
      });
      router.back();
    } catch {
      setMenyimpan(false);
      Alert.alert('Gagal menyimpan', 'Terjadi masalah saat menyimpan. Coba lagi.');
    }
  }

  const input = [s.input, { backgroundColor: warna.kartu, borderColor: warna.garis, color: warna.teks }];

  return (
    <View style={{ flex: 1, backgroundColor: warna.latar }}>
      <MapView
        ref={peta}
        style={s.peta}
        initialRegion={WILAYAH_AWAL}
        onPress={(e) => tandai(e.nativeEvent.coordinate, false)}
      >
        {titik && <Marker coordinate={titik} pinColor={warna.aksen} />}
      </MapView>

      <ScrollView contentContainerStyle={s.isi} keyboardShouldPersistTaps="handled">
        <Text style={{ color: warna.teksRedup, fontSize: 13 }}>
          Ketuk peta untuk menandai tempat tujuan.
        </Text>

        <Pressable disabled={memuat} onPress={pakaiLokasiSaatIni} style={s.tombolLokasi}>
          <Ionicons name="locate-outline" size={18} color={warna.aksen} />
          <Text style={{ color: warna.aksen, fontWeight: '600' }}>Pakai lokasi saat ini</Text>
          {memuat && <ActivityIndicator size="small" color={warna.aksen} />}
        </Pressable>

        {izinDitolak && (
          <View style={s.banner}>
            <Text style={{ color: '#7B241C' }}>
              Izin lokasi ditolak. Kamu tetap bisa menandai tempat lewat peta.
            </Text>
            <Pressable onPress={() => Linking.openSettings()}>
              <Text style={{ color: '#7B241C', fontWeight: '700', marginTop: 6 }}>Buka pengaturan</Text>
            </Pressable>
          </View>
        )}

        <Text style={[s.label, { color: warna.teks }]}>Nama tempat</Text>
        <TextInput
          style={input}
          value={nama}
          onChangeText={(t) => {
            manual.current.nama = true;
            setNama(t);
          }}
          placeholder="Contoh: Pantai Sigandu"
          placeholderTextColor={warna.teksRedup}
        />

        <Text style={[s.label, { color: warna.teks }]}>Kota</Text>
        <TextInput
          style={input}
          value={kota}
          onChangeText={(t) => {
            manual.current.kota = true;
            setKota(t);
          }}
          placeholder="Contoh: Batang"
          placeholderTextColor={warna.teksRedup}
        />

        <Pressable
          disabled={menyimpan || memuat}
          onPress={simpan}
          style={[s.simpan, { backgroundColor: warna.aksen, opacity: menyimpan || memuat ? 0.6 : 1 }]}
        >
          <Text style={s.teksSimpan}>{menyimpan ? 'Menyimpan...' : 'Simpan ke Wishlist'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  peta: { height: 260 },
  isi: { padding: 16, paddingBottom: 40 },
  tombolLokasi: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 12 },
  banner: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#C0392B',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  label: { fontSize: 14, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  simpan: { marginTop: 28, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  teksSimpan: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});