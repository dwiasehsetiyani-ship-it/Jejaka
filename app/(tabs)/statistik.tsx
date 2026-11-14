import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilStatistik, Statistik as TipeStatistik } from '../../src/db/statistik';
import { useTema } from '../../src/theme/tema';

export default function Statistik() {
  const { warna } = useTema();
  const db = useSQLiteContext();
  const [st, setSt] = useState<TipeStatistik | null>(null);

  useFocusEffect(
    useCallback(() => {
      ambilStatistik(db).then(setSt).catch(() => {});
    }, [db])
  );

  if (!st) {
    return <View style={{ flex: 1, backgroundColor: warna.latar }} />;
  }

  if (st.jumlahTempat === 0) {
    return (
      <View style={[s.kosong, { backgroundColor: warna.latar }]}>
        <Text style={{ color: warna.teksRedup, textAlign: 'center' }}>
          Belum ada data. Tambahkan entri di tab Jurnal untuk melihat statistik perjalananmu.
        </Text>
      </View>
    );
  }

  const favorit = st.perKategori[0]?.kategori ?? '-';
  const rata = st.rataRating !== null ? st.rataRating.toFixed(1).replace('.', ',') : '-';
  const maks = Math.max(...st.perKategori.map((k) => k.jumlah), 1);

  const kartu: { nilai: string; label: string; kapital?: boolean }[] = [
    { nilai: String(st.jumlahTempat), label: 'Tempat dikunjungi' },
    { nilai: String(st.jumlahKota), label: 'Kota' },
    { nilai: rata, label: 'Rata-rata rating' },
    { nilai: favorit, label: 'Kategori favorit', kapital: true },
  ];

  return (
    <ScrollView style={{ backgroundColor: warna.latar }} contentContainerStyle={s.isi}>
      <View style={s.grid}>
        {kartu.map((k) => (
          <View key={k.label} style={[s.kartu, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
            <Text
              style={[s.nilai, { color: warna.aksen }, k.kapital && { textTransform: 'capitalize' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {k.nilai}
            </Text>
            <Text style={{ color: warna.teksRedup, fontSize: 12 }}>{k.label}</Text>
          </View>
        ))}
      </View>

      <View style={[s.panel, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
        <Text style={[s.judul, { color: warna.teks }]}>Tempat per kategori</Text>
        {st.perKategori.map((k) => (
          <View key={k.kategori} style={s.barisBar}>
            <Text style={[s.namaBar, { color: warna.teks }]}>{k.kategori}</Text>
            <View style={[s.trek, { backgroundColor: warna.garis }]}>
              <View style={[s.isiBar, { backgroundColor: warna.aksen, width: `${(k.jumlah / maks) * 100}%` }]} />
            </View>
            <Text style={[s.jumlah, { color: warna.teks }]}>{k.jumlah}</Text>
          </View>
        ))}
      </View>

      {st.kotaTerbanyak.length > 0 && (
        <View style={[s.panel, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
          <Text style={[s.judul, { color: warna.teks }]}>Kota terbanyak</Text>
          {st.kotaTerbanyak.map((k, i) => (
            <View key={k.kota} style={s.barisKota}>
              <Text style={{ color: warna.aksen, fontWeight: '800', width: 24 }}>{i + 1}</Text>
              <Text style={{ color: warna.teks, flex: 1 }}>{k.kota}</Text>
              <Text style={{ color: warna.teksRedup }}>{k.jumlah} tempat</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  kosong: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  isi: { padding: 12, gap: 12, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kartu: { width: '47.5%', borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
  nilai: { fontSize: 30, fontWeight: '800' },
  panel: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  judul: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  barisBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  namaBar: { width: 64, fontSize: 13, textTransform: 'capitalize' },
  trek: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  isiBar: { height: 12, borderRadius: 6 },
  jumlah: { width: 24, textAlign: 'right', fontWeight: '700' },
  barisKota: { flexDirection: 'row', alignItems: 'center' },
});