import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Bintang from '../../src/components/Bintang';
import { daftarEntri, EntriRingkas } from '../../src/db/entri';
import { useTema } from '../../src/theme/tema';

export default function Jurnal() {
  const { warna } = useTema();
  const router = useRouter();
  const db = useSQLiteContext();
  const [data, setData] = useState<EntriRingkas[]>([]);

  useFocusEffect(
    useCallback(() => {
      daftarEntri(db).then(setData).catch(() => {});
    }, [db])
  );

  return (
    <View style={[s.wadah, { backgroundColor: warna.latar }]}>
      <FlatList
        data={data}
        keyExtractor={(e) => e.id}
        contentContainerStyle={data.length ? s.daftar : s.kosong}
        ListEmptyComponent={
          <Text style={{ color: warna.teksRedup }}>Belum ada entri. Ketuk + untuk mulai.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/entri/${item.id}`)}
            style={[s.kartu, { backgroundColor: warna.kartu, borderColor: warna.garis }]}
          >
            {item.foto_utama ? (
              <Image source={{ uri: item.foto_utama }} style={s.gambar} />
            ) : (
              <View style={[s.gambar, s.tanpaFoto, { backgroundColor: warna.garis }]}>
                <Ionicons name="image-outline" size={28} color={warna.teksRedup} />
              </View>
            )}
            <View style={s.info}>
              <Text style={[s.nama, { color: warna.teks }]} numberOfLines={1}>
                {item.nama_tempat}
              </Text>
              <Text style={{ color: warna.teksRedup, fontSize: 12 }} numberOfLines={1}>
                {[item.kota, new Date(item.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
              <Bintang nilai={item.rating} ukuran={14} />
              <View style={s.barisBawah}>
                <Text style={{ color: warna.aksen, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                  {item.kategori}
                </Text>
                {item.suhu !== null ? (
                  <View style={s.cuaca}>
                    <Ionicons name="partly-sunny-outline" size={14} color={warna.teksRedup} />
                    <Text style={{ color: warna.teksRedup, fontSize: 12 }}>
                      {item.suhu}°C
                    </Text>
                  </View>
                ) : item.latitude !== null ? (
                  <Ionicons name="cloud-offline-outline" size={14} color={warna.teksRedup} />
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />
      <Pressable style={[s.fab, { backgroundColor: warna.aksen }]} onPress={() => router.push('/tambah')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wadah: { flex: 1 },
  daftar: { padding: 12, gap: 10, paddingBottom: 100 },
  kosong: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kartu: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 10, gap: 12 },
  gambar: { width: 84, height: 84, borderRadius: 10 },
  tanpaFoto: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, justifyContent: 'space-between' },
  nama: { fontSize: 16, fontWeight: '700' },
  barisBawah: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cuaca: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});