import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FotoForm, simpanEntri, ubahEntri } from '../db/entri';
import { DAFTAR_KATEGORI, Entri, Kategori } from '../db/tipe';
import { useTema } from '../theme/tema';
import { ambilDariKamera, pilihDariGaleri } from '../utils/foto';
import Bintang from './Bintang';

const MAKS_FOTO = 3;

type Props = { awal?: Entri; fotoAwal?: string[] };

export default function FormEntri({ awal, fotoAwal = [] }: Props) {
  const { warna } = useTema();
  const db = useSQLiteContext();
  const router = useRouter();

  const [nama, setNama] = useState(awal?.nama_tempat ?? '');
  const [kota, setKota] = useState(awal?.kota ?? '');
  const [kategori, setKategori] = useState<Kategori>(awal?.kategori ?? 'alam');
  const [rating, setRating] = useState(awal?.rating ?? 0);
  const [catatan, setCatatan] = useState(awal?.catatan ?? '');
  const [foto, setFoto] = useState<FotoForm[]>(fotoAwal.map((uri) => ({ uri, baru: false })));
  const [tanggal] = useState(awal?.tanggal_kunjungan ?? new Date().toISOString());
  const [sibuk, setSibuk] = useState(false);

  const sisa = MAKS_FOTO - foto.length;

  async function dariKamera() {
    if (sisa <= 0) return;
    setSibuk(true);
    try {
      const uri = await ambilDariKamera();
      if (uri) setFoto((f) => [...f, { uri, baru: true }]);
    } catch {
      Alert.alert('Gagal', 'Foto tidak bisa diambil. Coba lagi.');
    }
    setSibuk(false);
  }

  async function dariGaleri() {
    if (sisa <= 0) return;
    setSibuk(true);
    try {
      const uris = await pilihDariGaleri(sisa);
      if (uris.length) setFoto((f) => [...f, ...uris.map((uri) => ({ uri, baru: true }))].slice(0, MAKS_FOTO));
    } catch {
      Alert.alert('Gagal', 'Foto tidak bisa dipilih. Coba lagi.');
    }
    setSibuk(false);
  }

  async function simpan() {
    if (!nama.trim()) {
      Alert.alert('Nama tempat kosong', 'Isi nama tempat dulu sebelum menyimpan.');
      return;
    }
    setSibuk(true);
    const data = {
      nama_tempat: nama.trim(),
      kota: kota.trim(),
      kategori,
      rating,
      catatan: catatan.trim(),
      tanggal_kunjungan: tanggal,
    };
    try {
      if (awal) await ubahEntri(db, awal.id, data, foto);
      else await simpanEntri(db, data, foto);
      router.back();
    } catch {
      setSibuk(false);
      Alert.alert('Gagal menyimpan', 'Terjadi masalah saat menyimpan entri. Coba lagi.');
    }
  }

  const tanggalTampil = new Date(tanggal).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const input = [s.input, { backgroundColor: warna.kartu, borderColor: warna.garis, color: warna.teks }];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: warna.latar }}
        contentContainerStyle={s.isi}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[s.label, { color: warna.teks }]}>Foto ({foto.length}/{MAKS_FOTO})</Text>
        <View style={s.barisFoto}>
          {foto.map((f, i) => (
            <View key={f.uri + i} style={s.kotakFoto}>
              <Image source={{ uri: f.uri }} style={s.foto} />
              <Pressable style={s.hapusFoto} onPress={() => setFoto((x) => x.filter((_, j) => j !== i))}>
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
        <View style={s.barisTombol}>
          <Pressable
            disabled={sibuk || sisa <= 0}
            onPress={dariKamera}
            style={[s.tombol, { backgroundColor: warna.aksen, opacity: sibuk || sisa <= 0 ? 0.5 : 1 }]}
          >
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            <Text style={s.teksTombol}>Kamera</Text>
          </Pressable>
          <Pressable
            disabled={sibuk || sisa <= 0}
            onPress={dariGaleri}
            style={[s.tombol, s.tombolGaris, { borderColor: warna.aksen, opacity: sibuk || sisa <= 0 ? 0.5 : 1 }]}
          >
            <Ionicons name="images-outline" size={18} color={warna.aksen} />
            <Text style={[s.teksTombol, { color: warna.aksen }]}>Galeri</Text>
          </Pressable>
        </View>

        <Text style={[s.label, { color: warna.teks }]}>Nama tempat</Text>
        <TextInput
          style={input}
          value={nama}
          onChangeText={setNama}
          placeholder="Contoh: Pantai Pasir Kencana"
          placeholderTextColor={warna.teksRedup}
        />

        <Text style={[s.label, { color: warna.teks }]}>Kota</Text>
        <TextInput
          style={input}
          value={kota}
          onChangeText={setKota}
          placeholder="Contoh: Pekalongan"
          placeholderTextColor={warna.teksRedup}
        />

        <Text style={[s.label, { color: warna.teks }]}>Tanggal kunjungan</Text>
        <Text style={{ color: warna.teksRedup }}>{tanggalTampil}</Text>

        <Text style={[s.label, { color: warna.teks }]}>Kategori</Text>
        <View style={s.barisChip}>
          {DAFTAR_KATEGORI.map((k) => {
            const aktif = k === kategori;
            return (
              <Pressable
                key={k}
                onPress={() => setKategori(k)}
                style={[s.chip, { borderColor: warna.aksen }, aktif && { backgroundColor: warna.aksen }]}
              >
                <Text style={{ color: aktif ? '#FFFFFF' : warna.aksen, fontWeight: '600', textTransform: 'capitalize' }}>
                  {k}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.label, { color: warna.teks }]}>Rating</Text>
        <Bintang nilai={rating} onUbah={setRating} ukuran={30} />

        <Text style={[s.label, { color: warna.teks }]}>Catatan</Text>
        <TextInput
          style={[...input, { minHeight: 100, textAlignVertical: 'top' }]}
          value={catatan}
          onChangeText={setCatatan}
          multiline
          placeholder="Kesan, tips, atau hal yang ingin diingat"
          placeholderTextColor={warna.teksRedup}
        />

        <Pressable
          disabled={sibuk}
          onPress={simpan}
          style={[s.simpan, { backgroundColor: warna.aksen, opacity: sibuk ? 0.6 : 1 }]}
        >
          <Text style={s.teksSimpan}>{sibuk ? 'Memproses...' : awal ? 'Simpan Perubahan' : 'Simpan Entri'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  isi: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  barisFoto: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  kotakFoto: { width: 96, height: 96 },
  foto: { width: 96, height: 96, borderRadius: 10 },
  hapusFoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barisTombol: { flexDirection: 'row', gap: 10, marginTop: 10 },
  tombol: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  tombolGaris: { borderWidth: 1.5 },
  teksTombol: { color: '#FFFFFF', fontWeight: '700' },
  barisChip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  simpan: { marginTop: 28, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  teksSimpan: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});