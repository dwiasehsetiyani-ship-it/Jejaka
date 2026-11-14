import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Bintang from '../../../src/components/Bintang';
import { ambilEntri, ambilFoto, hapusEntri } from '../../../src/db/entri';
import type { Entri, Foto } from '../../../src/db/tipe';
import { simpanWiki } from '../../../src/db/wiki';
import { cariWikipedia } from '../../../src/services/wikipedia';
import { useTema } from '../../../src/theme/tema';

export default function DetailEntri() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { warna } = useTema();
  const db = useSQLiteContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const net = useNetInfo();
  const online = net.isConnected !== false && net.isInternetReachable !== false;

  const [entri, setEntri] = useState<Entri | null>(null);
  const [foto, setFoto] = useState<Foto[]>([]);
  const [selesaiMuat, setSelesaiMuat] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const e = await ambilEntri(db, id);
        setEntri(e ?? null);
        setFoto(e ? await ambilFoto(db, id) : []);
        setSelesaiMuat(true);
      })().catch(() => setSelesaiMuat(true));
    }, [db, id])
  );

  // Cari info Wikipedia sekali saja, saat online dan entri punya lokasi.
  useEffect(() => {
    if (!entri || entri.wiki_judul !== null || entri.latitude === null || entri.longitude === null || !online) {
      return;
    }
    let batal = false;
    cariWikipedia({ latitude: entri.latitude, longitude: entri.longitude }, entri.nama_tempat)
      .then(async (h) => {
        if (batal || h.status === 'gagal') return;
        const judul = h.status === 'ada' ? h.judul : '';
        const ringkasan = h.status === 'ada' ? h.ringkasan : '';
        await simpanWiki(db, entri.id, judul, ringkasan);
        if (!batal) {
          setEntri((e) => (e && e.id === entri.id ? { ...e, wiki_judul: judul, wiki_ringkasan: ringkasan } : e));
        }
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [entri?.id, entri?.wiki_judul, online]);

  function konfirmasiHapus() {
    if (!entri) return;
    Alert.alert(
      'Hapus entri ini?',
      `Entri "${entri.nama_tempat}" dan ${foto.length} foto akan dihapus. Tindakan ini tidak bisa dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await hapusEntri(db, id);
            router.back();
          },
        },
      ]
    );
  }

  async function sembunyikanWiki() {
    if (!entri) return;
    await simpanWiki(db, entri.id, '', '');
    setEntri({ ...entri, wiki_judul: '', wiki_ringkasan: '' });
  }

  if (!entri) {
    return (
      <View style={[s.tengah, { backgroundColor: warna.latar }]}>
        <Text style={{ color: warna.teksRedup }}>{selesaiMuat ? 'Entri tidak ditemukan.' : 'Memuat...'}</Text>
      </View>
    );
  }

  const tanggal = new Date(entri.tanggal_kunjungan).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const cuacaTerisi = entri.status_cuaca === 'terisi' && entri.suhu !== null;
  const punyaLokasi = entri.latitude !== null && entri.longitude !== null;
  const adaWiki = !!entri.wiki_judul && !!entri.wiki_ringkasan;

  return (
    <ScrollView style={{ backgroundColor: warna.latar }} contentContainerStyle={{ paddingBottom: 40 }}>
      {foto.length > 0 && (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {foto.map((f) => (
            <Image key={f.id} source={{ uri: f.path_berkas }} style={[s.fotoBesar, { width }]} />
          ))}
        </ScrollView>
      )}
      <View style={s.isi}>
        <Text style={[s.nama, { color: warna.teks }]}>{entri.nama_tempat}</Text>
        <Text style={{ color: warna.teksRedup }}>{[entri.kota, tanggal].filter(Boolean).join(' • ')}</Text>
        <View style={s.baris}>
          <Bintang nilai={entri.rating} />
          <Text style={{ color: warna.aksen, fontWeight: '700', textTransform: 'capitalize' }}>{entri.kategori}</Text>
        </View>

        <View style={[s.cuaca, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
          <Ionicons
            name={cuacaTerisi ? 'partly-sunny-outline' : 'cloud-offline-outline'}
            size={28}
            color={warna.aksen}
          />
          <View style={{ flex: 1 }}>
            {cuacaTerisi ? (
              <>
                <Text style={[s.suhu, { color: warna.teks }]}>{entri.suhu}°C</Text>
                <Text style={{ color: warna.teksRedup }}>{entri.kondisi_cuaca}</Text>
              </>
            ) : punyaLokasi ? (
              <>
                <Text style={{ color: warna.teks, fontWeight: '700' }}>Cuaca menunggu koneksi</Text>
                <Text style={{ color: warna.teksRedup }}>Akan terisi sendiri saat internet tersambung.</Text>
              </>
            ) : (
              <>
                <Text style={{ color: warna.teks, fontWeight: '700' }}>Cuaca tidak tersedia</Text>
                <Text style={{ color: warna.teksRedup }}>Entri ini tidak punya data lokasi.</Text>
              </>
            )}
          </View>
        </View>

        {adaWiki && (
          <View style={[s.wiki, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
            <View style={s.wikiAtas}>
              <Text style={[s.wikiJudul, { color: warna.teks }]}>Tentang tempat</Text>
              <Pressable onPress={sembunyikanWiki} hitSlop={8}>
                <Text style={{ color: warna.teksRedup, fontSize: 13 }}>Sembunyikan</Text>
              </Pressable>
            </View>
            <Text style={{ color: warna.teks, lineHeight: 20 }} numberOfLines={7}>
              {entri.wiki_ringkasan}
            </Text>
            <Text style={{ color: warna.teksRedup, fontSize: 12 }}>
              Sumber: Wikipedia, artikel "{entri.wiki_judul}" (lisensi CC BY-SA)
            </Text>
            <Pressable
              onPress={() =>
                Linking.openURL(
                  `https://id.wikipedia.org/wiki/${encodeURIComponent(entri.wiki_judul!.replace(/ /g, '_'))}`
                )
              }
            >
              <Text style={{ color: warna.aksen, fontWeight: '700' }}>Baca di Wikipedia</Text>
            </Pressable>
          </View>
        )}

        <Text style={[s.label, { color: warna.teks }]}>Catatan</Text>
        <Text style={{ color: entri.catatan ? warna.teks : warna.teksRedup, lineHeight: 21 }}>
          {entri.catatan || 'Tidak ada catatan.'}
        </Text>

        {punyaLokasi && (
          <Pressable
            onPress={() => router.navigate({ pathname: '/peta', params: { id, t: String(Date.now()) } })}
            style={[s.lihatPeta, { borderColor: warna.garis, backgroundColor: warna.kartu }]}
          >
            <Ionicons name="location-outline" size={18} color={warna.aksen} />
            <Text style={{ color: warna.aksen, fontWeight: '600' }}>Lihat di peta</Text>
          </Pressable>
        )}

        <View style={s.barisTombol}>
          <Pressable
            onPress={() => router.push(`/entri/${id}/ubah`)}
            style={[s.tombol, { borderColor: warna.aksen }]}
          >
            <Text style={{ color: warna.aksen, fontWeight: '700' }}>Ubah</Text>
          </Pressable>
          <Pressable onPress={konfirmasiHapus} style={[s.tombol, { borderColor: '#C0392B' }]}>
            <Text style={{ color: '#C0392B', fontWeight: '700' }}>Hapus</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  tengah: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fotoBesar: { height: 280, resizeMode: 'cover' },
  isi: { padding: 16, gap: 6 },
  nama: { fontSize: 22, fontWeight: '800' },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cuaca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  suhu: { fontSize: 24, fontWeight: '800' },
  wiki: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 12, gap: 8 },
  wikiAtas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wikiJudul: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '700', marginTop: 18, marginBottom: 4 },
  lihatPeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  barisTombol: { flexDirection: 'row', gap: 12, marginTop: 16 },
  tombol: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});