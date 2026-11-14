import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { hapusSemuaData } from '../src/db/reset';
import { FILTER_KOSONG, useFilter } from '../src/filter';
import { useKunci } from '../src/kunci';
import { PilihanTema, useTema } from '../src/theme/tema';
import { ukuranFoto } from '../src/utils/penyimpanan';

const OPSI: { nilai: PilihanTema; label: string }[] = [
  { nilai: 'terang', label: 'Terang' },
  { nilai: 'gelap', label: 'Gelap' },
  { nilai: 'sistem', label: 'Sistem' },
];

export default function Pengaturan() {
  const { warna, pilihan, setPilihan } = useTema();
  const { aktif, tersedia, ubahKunci } = useKunci();
  const { setFilter } = useFilter();
  const db = useSQLiteContext();
  const router = useRouter();
  const [jumlahEntri, setJumlahEntri] = useState(0);
  const [foto, setFoto] = useState({ jumlah: 0, byte: 0 });

  const muat = useCallback(async () => {
    const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM entri');
    setJumlahEntri(r?.n ?? 0);
    setFoto(ukuranFoto());
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      muat().catch(() => {});
    }, [muat])
  );

  async function gantiKunci(nyala: boolean) {
    const ok = await ubahKunci(nyala);
    if (!ok && nyala) {
      Alert.alert(
        'Kunci belum bisa dinyalakan',
        tersedia
          ? 'Verifikasi dibatalkan atau gagal. Coba lagi.'
          : 'Ponsel ini belum punya biometrik atau PIN, pola, atau sandi layar. Atur dulu di pengaturan ponsel.'
      );
    }
  }

  function hapusSemua() {
    Alert.alert(
      'Hapus semua data?',
      'Semua entri, foto, dan wishlist akan dihapus dari ponsel ini. Tindakan ini tidak bisa dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus semua',
          style: 'destructive',
          onPress: async () => {
            await hapusSemuaData(db);
            setFilter(FILTER_KOSONG);
            await muat();
            Alert.alert('Selesai', 'Semua data sudah dihapus.');
          },
        },
      ]
    );
  }

  const mb = (foto.byte / 1048576).toFixed(1).replace('.', ',');
  const kartu = [s.kartu, { backgroundColor: warna.kartu, borderColor: warna.garis }];

  return (
    <ScrollView style={{ backgroundColor: warna.latar }} contentContainerStyle={s.isi}>
      <Text style={[s.judul, { color: warna.teks }]}>Tampilan</Text>
      <View style={[s.segmen, { borderColor: warna.garis, backgroundColor: warna.kartu }]}>
        {OPSI.map((o) => {
          const dipilih = pilihan === o.nilai;
          return (
            <Pressable
              key={o.nilai}
              onPress={() => setPilihan(o.nilai)}
              style={[s.opsi, dipilih && { backgroundColor: warna.aksen }]}
            >
              <Text style={{ color: dipilih ? '#FFFFFF' : warna.teks, fontWeight: '600' }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[s.judul, { color: warna.teks }]}>Privasi</Text>
      <View style={kartu}>
        <View style={s.baris}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: warna.teks, fontWeight: '700' }}>Kunci aplikasi</Text>
            <Text style={{ color: warna.teksRedup, fontSize: 12, marginTop: 2 }}>
              Biometrik atau PIN perangkat
            </Text>
          </View>
          <Switch
            value={aktif}
            onValueChange={gantiKunci}
            disabled={!tersedia && !aktif}
            trackColor={{ true: warna.aksen }}
          />
        </View>
        {!tersedia && !aktif && (
          <Text style={{ color: warna.teksRedup, fontSize: 12 }}>
            Tidak tersedia: ponsel ini belum punya biometrik atau PIN, pola, atau sandi layar.
          </Text>
        )}
        <Text style={{ color: warna.teksRedup, fontSize: 12 }}>
          Semua data tersimpan di ponsel ini. Tidak ada akun dan tidak ada server.
        </Text>
      </View>

      <Text style={[s.judul, { color: warna.teks }]}>Penyimpanan</Text>
      <View style={kartu}>
        <Text style={{ color: warna.teks, fontWeight: '700' }}>Terpakai: {mb} MB</Text>
        <Text style={{ color: warna.teksRedup, fontSize: 12 }}>
          {foto.jumlah} foto dari {jumlahEntri} entri
        </Text>
        <Pressable onPress={() => router.push('/ekspor')} style={[s.baris, s.garisAtas, { borderColor: warna.garis }]}>
          <Text style={{ color: warna.aksen, fontWeight: '700', flex: 1 }}>Ekspor jurnal ke PDF</Text>
          <Ionicons name="chevron-forward" size={18} color={warna.aksen} />
        </Pressable>
        <Text style={{ color: warna.teksRedup, fontSize: 12 }}>
          Data hilang kalau aplikasi dihapus atau ponsel diganti. PDF bukan cadangan penuh.
        </Text>
      </View>

      <Pressable onPress={hapusSemua} style={[s.hapus, { borderColor: '#C0392B' }]}>
        <Text style={{ color: '#C0392B', fontWeight: '700' }}>Hapus semua data</Text>
      </Pressable>

      <Text style={[s.judul, { color: warna.teks }]}>Tentang dan atribusi</Text>
      <View style={kartu}>
        <Text style={{ color: warna.teks, fontSize: 13 }}>Cuaca: Open-Meteo.com (CC BY 4.0)</Text>
        <Text style={{ color: warna.teks, fontSize: 13 }}>
          Nama tempat cadangan: OpenStreetMap contributors (ODbL)
        </Text>
        <Text style={{ color: warna.teks, fontSize: 13 }}>Info tempat: Wikipedia (CC BY-SA)</Text>
        <Text style={{ color: warna.teksRedup, fontSize: 12, marginTop: 6 }}>
          Jejaka • Proyek Akhir Pemrograman Berbasis Platform
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  isi: { padding: 16, paddingBottom: 40 },
  judul: { fontSize: 15, fontWeight: '700', marginTop: 22, marginBottom: 10 },
  segmen: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4 },
  opsi: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  kartu: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  garisAtas: { borderTopWidth: 1, paddingTop: 12, marginTop: 6 },
  hapus: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
});