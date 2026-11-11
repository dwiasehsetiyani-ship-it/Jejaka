import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Bintang from '../../src/components/Bintang';
import BannerOffline from '../../src/components/BannerOffline';
import { cariEntri, daftarKota, Filter } from '../../src/db/cari';
import type { EntriRingkas } from '../../src/db/entri';
import { DAFTAR_KATEGORI } from '../../src/db/tipe';
import { useTema } from '../../src/theme/tema';
import { useFilter } from '../../src/filter';

export default function Jurnal() {
  const { warna } = useTema();
  const router = useRouter();
  const db = useSQLiteContext();
  const [data, setData] = useState<EntriRingkas[]>([]);
  const [kota, setKota] = useState<string[]>([]);
   const { filter, setFilter } = useFilter();

  const filterAktif = filter.kategori !== null || filter.kota !== null || filter.teks.trim() !== '';

  useFocusEffect(
    useCallback(() => {
      cariEntri(db, filter).then(setData).catch(() => {});
      daftarKota(db).then(setKota).catch(() => {});
    }, [db, filter])
  );

  function chip(label: string, aktif: boolean, onPress: () => void) {
    return (
      <Pressable
        key={label}
        onPress={onPress}
        style={[s.chip, { borderColor: warna.aksen }, aktif && { backgroundColor: warna.aksen }]}
      >
        <Text style={{ color: aktif ? '#FFFFFF' : warna.aksen, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[s.wadah, { backgroundColor: warna.latar }]}>
      <BannerOffline />

      <View style={s.kepala}>
        <View style={[s.kolomCari, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
          <Ionicons name="search-outline" size={18} color={warna.teksRedup} />
          <TextInput
            style={[s.inputCari, { color: warna.teks }]}
            value={filter.teks}
            onChangeText={(t) => setFilter((f) => ({ ...f, teks: t }))}
            placeholder="Cari nama tempat atau catatan"
            placeholderTextColor={warna.teksRedup}
            returnKeyType="search"
          />
          {filter.teks !== '' && (
            <Pressable onPress={() => setFilter((f) => ({ ...f, teks: '' }))} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={warna.teksRedup} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.barisChip}>
          {chip('Semua', filter.kategori === null, () => setFilter((f) => ({ ...f, kategori: null })))}
          {DAFTAR_KATEGORI.map((k) =>
            chip(k, filter.kategori === k, () => setFilter((f) => ({ ...f, kategori: f.kategori === k ? null : k })))
          )}
        </ScrollView>

        {kota.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.barisChip}>
            {chip('Semua kota', filter.kota === null, () => setFilter((f) => ({ ...f, kota: null })))}
            {kota.map((k) =>
              chip(k, filter.kota === k, () => setFilter((f) => ({ ...f, kota: f.kota === k ? null : k })))
            )}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={data}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={data.length ? s.daftar : s.kosong}
        ListEmptyComponent={
          <Text style={{ color: warna.teksRedup }}>
            {filterAktif ? 'Tidak ada entri yang cocok.' : 'Belum ada entri. Ketuk + untuk mulai.'}
          </Text>
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
                    <Text style={{ color: warna.teksRedup, fontSize: 12 }}>{item.suhu}°C</Text>
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
  kepala: { paddingTop: 10, gap: 8 },
  kolomCari: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 12,
  },
  inputCari: { flex: 1, paddingVertical: 10, fontSize: 15 },
  barisChip: { paddingHorizontal: 12, gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
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