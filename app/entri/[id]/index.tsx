import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Bintang from '../../../src/components/Bintang';
import { ambilEntri, ambilFoto, hapusEntri } from '../../../src/db/entri';
import type { Entri, Foto } from '../../../src/db/tipe';
import { useTema } from '../../../src/theme/tema';

export default function DetailEntri() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { warna } = useTema();
  const db = useSQLiteContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
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
        <Text style={{ color: warna.teksRedup }}>
          {[entri.kota, tanggal].filter(Boolean).join(' • ')}
        </Text>
        <View style={s.baris}>
          <Bintang nilai={entri.rating} />
          <Text style={{ color: warna.aksen, fontWeight: '700', textTransform: 'capitalize' }}>{entri.kategori}</Text>
        </View>

        <Text style={[s.label, { color: warna.teks }]}>Catatan</Text>
        <Text style={{ color: entri.catatan ? warna.teks : warna.teksRedup, lineHeight: 21 }}>
          {entri.catatan || 'Tidak ada catatan.'}
        </Text>

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
  label: { fontSize: 14, fontWeight: '700', marginTop: 18, marginBottom: 4 },
  barisTombol: { flexDirection: 'row', gap: 12, marginTop: 28 },
  tombol: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});