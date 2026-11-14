import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { daftarWishlist, hapusWishlist, ItemWishlist } from '../../src/db/wishlist';
import { posisiSaatIni, type Titik } from '../../src/services/lokasi';
import { useTema } from '../../src/theme/tema';
import { formatJarak, jarakKm } from '../../src/utils/jarak';

export default function Wishlist() {
  const { warna } = useTema();
  const db = useSQLiteContext();
  const router = useRouter();
  const [data, setData] = useState<ItemWishlist[]>([]);
  const [posisi, setPosisi] = useState<Titik | null>(null);
  const [ditolak, setDitolak] = useState(false);

  useFocusEffect(
    useCallback(() => {
      daftarWishlist(db).then(setData).catch(() => {});
      posisiSaatIni()
        .then((p) => {
          setPosisi(p.titik);
          setDitolak(p.ditolak);
        })
        .catch(() => {});
    }, [db])
  );

  function hapus(item: ItemWishlist) {
    Alert.alert('Hapus dari wishlist?', `"${item.nama_tempat}" akan dihapus dari daftar tujuan.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await hapusWishlist(db, item.id);
          setData((d) => d.filter((x) => x.id !== item.id));
        },
      },
    ]);
  }

  function sudahDikunjungi(item: ItemWishlist) {
    router.push({
      pathname: '/tambah',
      params: {
        wid: item.id,
        nama: item.nama_tempat,
        kota: item.kota,
        lat: String(item.latitude),
        lon: String(item.longitude),
      },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: warna.latar }}>
      {ditolak && (
        <View style={s.banner}>
          <Text style={{ color: '#7B241C', fontSize: 13 }}>
            Izin lokasi ditolak, jadi jarak tidak ditampilkan.
          </Text>
        </View>
      )}
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={data.length ? s.daftar : s.kosong}
        ListEmptyComponent={
          <Text style={{ color: warna.teksRedup, textAlign: 'center' }}>
            Belum ada tempat tujuan. Ketuk + untuk menambah.
          </Text>
        }
        renderItem={({ item }) => {
          const km =
            posisi && item.latitude !== null && item.longitude !== null
              ? jarakKm(posisi, { latitude: item.latitude, longitude: item.longitude })
              : null;
          return (
            <View style={[s.kartu, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
              <View style={s.atas}>
                <Ionicons name="location" size={22} color={warna.aksen} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.nama, { color: warna.teks }]}>{item.nama_tempat}</Text>
                  {item.kota !== '' && <Text style={{ color: warna.teksRedup }}>{item.kota}</Text>}
                  {km !== null && (
                    <Text style={{ color: warna.aksen, fontSize: 12, marginTop: 2 }}>
                      {formatJarak(km)} dari posisimu (garis lurus)
                    </Text>
                  )}
                </View>
              </View>
              <View style={s.baris}>
                <Pressable
                  onPress={() => sudahDikunjungi(item)}
                  style={[s.tombol, { borderColor: warna.aksen }]}
                >
                  <Text style={{ color: warna.aksen, fontWeight: '700' }}>Sudah dikunjungi</Text>
                </Pressable>
                <Pressable onPress={() => hapus(item)} hitSlop={8} style={s.hapus}>
                  <Text style={{ color: '#C0392B', fontWeight: '600' }}>Hapus</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
      <Pressable
        style={[s.fab, { backgroundColor: warna.aksen }]}
        onPress={() => router.push('/tambah-wishlist')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: '#FDECEA',
    borderBottomWidth: 1,
    borderBottomColor: '#C0392B',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  daftar: { padding: 12, gap: 10, paddingBottom: 100 },
  kosong: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  kartu: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
  atas: { flexDirection: 'row', gap: 10 },
  nama: { fontSize: 16, fontWeight: '700' },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tombol: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  hapus: { paddingHorizontal: 8, paddingVertical: 6 },
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