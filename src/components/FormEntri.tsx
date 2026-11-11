import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
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
import { ambilCuaca } from '../services/cuaca';
import { isiTempat, posisiSaatIni, type Titik } from '../services/lokasi';
import { useTema } from '../theme/tema';
import { ambilDariKamera, pilihDariGaleri } from '../utils/foto';
import Bintang from './Bintang';

const MAKS_FOTO = 3;

type Props = { awal?: Entri; fotoAwal?: string[] };
type InfoLokasi = 'ditolak' | 'gagal' | 'tanpaMetadata' | null;

export default function FormEntri({ awal, fotoAwal = [] }: Props) {
  const { warna } = useTema();
  const db = useSQLiteContext();
  const router = useRouter();
  const net = useNetInfo();
  const online = net.isConnected !== false && net.isInternetReachable !== false;

  const [nama, setNama] = useState(awal?.nama_tempat ?? '');
  const [kota, setKota] = useState(awal?.kota ?? '');
  const [kategori, setKategori] = useState<Kategori>(awal?.kategori ?? 'alam');
  const [rating, setRating] = useState(awal?.rating ?? 0);
  const [catatan, setCatatan] = useState(awal?.catatan ?? '');
  const [foto, setFoto] = useState<FotoForm[]>(fotoAwal.map((uri) => ({ uri, baru: false })));
  const [tanggal, setTanggal] = useState(awal?.tanggal_kunjungan ?? new Date().toISOString());
  const [lat, setLat] = useState<number | null>(awal?.latitude ?? null);
  const [lon, setLon] = useState<number | null>(awal?.longitude ?? null);
  const [suhu, setSuhu] = useState<number | null>(awal?.suhu ?? null);
  const [kondisi, setKondisi] = useState<string | null>(awal?.kondisi_cuaca ?? null);
  const [sibuk, setSibuk] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [infoLokasi, setInfoLokasi] = useState<InfoLokasi>(null);
  const [saran, setSaran] = useState<string[]>([]);

  const sisa = MAKS_FOTO - foto.length;

  useEffect(() => {
    db.getAllAsync<{ kota: string }>(
      `SELECT kota FROM entri WHERE kota != '' GROUP BY kota ORDER BY COUNT(*) DESC LIMIT 20`
    )
      .then((r) => setSaran(r.map((x) => x.kota)))
      .catch(() => {});
  }, [db]);

  // Isi nama tempat, kota, dan cuaca dari satu titik lokasi.
  async function isiOtomatis(titik: Titik, waktuISO: string, timpa: boolean) {
    setLat(titik.latitude);
    setLon(titik.longitude);
    setTanggal(waktuISO);
    setSuhu(null);
    setKondisi(null);
    setMemuat(true);
    try {
      const [tempat, cuaca] = await Promise.all([
        isiTempat(db, titik, online),
        online ? ambilCuaca(titik, waktuISO) : Promise.resolve(null),
      ]);
      setNama((n) => (timpa || !n.trim() ? tempat.nama_tempat || n : n));
      setKota((k) => (timpa || !k.trim() ? tempat.kota || k : k));
      if (cuaca) {
        setSuhu(cuaca.suhu);
        setKondisi(cuaca.kondisi);
      }
    } catch {}
    setMemuat(false);
  }

  async function dariKamera() {
    if (sisa <= 0) return;
    setSibuk(true);
    try {
      const uri = await ambilDariKamera();
      if (uri) {
        setFoto((f) => [...f, { uri, baru: true }]);
        if (!awal && lat === null) {
          const p = await posisiSaatIni();
          if (p.titik) {
            setInfoLokasi(null);
            await isiOtomatis(p.titik, new Date().toISOString(), false);
          } else {
            setInfoLokasi(p.ditolak ? 'ditolak' : 'gagal');
          }
        }
      }
    } catch {
      Alert.alert('Gagal', 'Foto tidak bisa diambil. Coba lagi.');
    }
    setSibuk(false);
  }

  async function dariGaleri() {
    if (sisa <= 0) return;
    setSibuk(true);
    try {
      const hasil = await pilihDariGaleri(sisa);
      if (hasil.length) {
        setFoto((f) => [...f, ...hasil.map((h) => ({ uri: h.uri, baru: true }))].slice(0, MAKS_FOTO));
        if (!awal && lat === null) {
          const berlokasi = hasil.find((h) => h.titik);
          if (berlokasi?.titik) {
            setInfoLokasi(null);
            await isiOtomatis(berlokasi.titik, berlokasi.waktu ?? new Date().toISOString(), false);
          } else {
            setInfoLokasi('tanpaMetadata');
          }
        }
      }
    } catch {
      Alert.alert('Gagal', 'Foto tidak bisa dipilih. Coba lagi.');
    }
    setSibuk(false);
  }

  async function pakaiLokasiSaatIni() {
    setMemuat(true);
    const p = await posisiSaatIni();
    if (p.titik) {
      setInfoLokasi(null);
      await isiOtomatis(p.titik, new Date().toISOString(), true);
    } else {
      setInfoLokasi(p.ditolak ? 'ditolak' : 'gagal');
      setMemuat(false);
    }
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
      latitude: lat,
      longitude: lon,
      suhu,
      kondisi_cuaca: kondisi,
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

  const ketikan = kota.trim().toLowerCase();
  const saranTampil = saran
    .filter((k) => k.toLowerCase() !== ketikan && k.toLowerCase().includes(ketikan))
    .slice(0, 4);

  const pesanInfo: Record<Exclude<InfoLokasi, null>, string> = {
    ditolak: 'Izin lokasi ditolak, jadi nama tempat dan kota perlu diisi manual.',
    gagal: 'Lokasi belum bisa didapat. Isi manual, atau coba lagi nanti.',
    tanpaMetadata: 'Foto ini tidak punya data lokasi. Isi manual, atau pakai tombol lokasi saat ini.',
  };

  const input = [s.input, { backgroundColor: warna.kartu, borderColor: warna.garis, color: warna.teks }];
  const terkunci = sibuk || memuat;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: warna.latar }}
        contentContainerStyle={s.isi}
        keyboardShouldPersistTaps="handled"
      >
        {!online && (
          <View style={[s.banner, { backgroundColor: '#FFF3CD', borderColor: '#E0A100' }]}>
            <Text style={{ color: '#5C4400' }}>
              Tanpa internet. Cuaca akan terisi sendiri saat koneksi kembali.
            </Text>
          </View>
        )}
        {infoLokasi && (
          <View style={[s.banner, { backgroundColor: '#FDECEA', borderColor: '#C0392B' }]}>
            <Text style={{ color: '#7B241C' }}>{pesanInfo[infoLokasi]}</Text>
            {infoLokasi === 'ditolak' && (
              <Pressable onPress={() => Linking.openSettings()}>
                <Text style={{ color: '#7B241C', fontWeight: '700', marginTop: 6 }}>Buka pengaturan</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={[s.label, { color: warna.teks, marginTop: 4 }]}>
          Foto ({foto.length}/{MAKS_FOTO})
        </Text>
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
            disabled={terkunci || sisa <= 0}
            onPress={dariKamera}
            style={[s.tombol, { backgroundColor: warna.aksen, opacity: terkunci || sisa <= 0 ? 0.5 : 1 }]}
          >
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            <Text style={s.teksTombol}>Kamera</Text>
          </Pressable>
          <Pressable
            disabled={terkunci || sisa <= 0}
            onPress={dariGaleri}
            style={[s.tombol, s.tombolGaris, { borderColor: warna.aksen, opacity: terkunci || sisa <= 0 ? 0.5 : 1 }]}
          >
            <Ionicons name="images-outline" size={18} color={warna.aksen} />
            <Text style={[s.teksTombol, { color: warna.aksen }]}>Galeri</Text>
          </Pressable>
        </View>

        {!awal && (
          <Pressable disabled={terkunci} onPress={pakaiLokasiSaatIni} style={s.tombolLokasi}>
            <Ionicons name="locate-outline" size={18} color={warna.aksen} />
            <Text style={{ color: warna.aksen, fontWeight: '600' }}>Pakai lokasi saat ini</Text>
          </Pressable>
        )}

        {(lat !== null || suhu !== null || memuat) && (
          <View style={[s.cuaca, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
            {memuat ? (
              <>
                <ActivityIndicator color={warna.aksen} />
                <Text style={{ color: warna.teksRedup }}>Mengisi lokasi dan cuaca...</Text>
              </>
            ) : (
              <>
                <Ionicons name="partly-sunny-outline" size={22} color={warna.aksen} />
                <Text style={{ color: warna.teks, fontWeight: '600' }}>
                  {suhu !== null ? `${suhu}°C, ${kondisi}` : 'Cuaca menunggu koneksi'}
                </Text>
              </>
            )}
          </View>
        )}

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
        {saranTampil.length > 0 && (
          <View style={[s.barisChip, { marginTop: 8 }]}>
            {saranTampil.map((k) => (
              <Pressable key={k} onPress={() => setKota(k)} style={[s.chipKecil, { borderColor: warna.garis }]}>
                <Text style={{ color: warna.teksRedup, fontSize: 13 }}>{k}</Text>
              </Pressable>
            ))}
          </View>
        )}

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
          disabled={terkunci}
          onPress={simpan}
          style={[s.simpan, { backgroundColor: warna.aksen, opacity: terkunci ? 0.6 : 1 }]}
        >
          <Text style={s.teksSimpan}>
            {sibuk ? 'Memproses...' : awal ? 'Simpan Perubahan' : 'Simpan Entri'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  isi: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  banner: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10 },
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
  tombolLokasi: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 14 },
  cuaca: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  barisChip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipKecil: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  simpan: { marginTop: 28, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  teksSimpan: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});