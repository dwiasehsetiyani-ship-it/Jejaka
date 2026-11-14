import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { cariEntri } from '../src/db/cari';
import type { EntriRingkas } from '../src/db/entri';
import { DAFTAR_KATEGORI, Kategori } from '../src/db/tipe';
import { useTema } from '../src/theme/tema';
import { buatHtml, OpsiPdf } from '../src/utils/pdf';

const TGL = /^\d{4}-\d{2}-\d{2}$/;

function baca(s: string, akhir: boolean): { ok: boolean; tgl: Date | null } {
  const t = s.trim();
  if (!t) return { ok: true, tgl: null };
  if (!TGL.test(t)) return { ok: false, tgl: null };
  const [y, m, d] = t.split('-').map(Number);
  const tgl = akhir ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
  if (isNaN(tgl.getTime()) || tgl.getMonth() !== m - 1) return { ok: false, tgl: null };
  return { ok: true, tgl };
}

function fmt(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function hariLalu(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmt(d);
}

export default function Ekspor() {
  const { warna } = useTema();
  const db = useSQLiteContext();
  const [mulai, setMulai] = useState('');
  const [akhir, setAkhir] = useState('');
  const [kategori, setKategori] = useState<Kategori | null>(null);
  const [opsi, setOpsi] = useState<OpsiPdf>({ foto: true, cuaca: true, catatan: true, wiki: false });
  const [jumlah, setJumlah] = useState(0);
  const [sibuk, setSibuk] = useState(false);

  const a = baca(mulai, false);
  const b = baca(akhir, true);
  const valid = a.ok && b.ok && !(a.tgl && b.tgl && a.tgl > b.tgl);

  async function ambilDaftar(): Promise<EntriRingkas[]> {
    const semua = await cariEntri(db, { kategori, kota: null, teks: '' });
    return semua
      .filter((e) => {
        const t = new Date(e.tanggal_kunjungan);
        return (!a.tgl || t >= a.tgl) && (!b.tgl || t <= b.tgl);
      })
      .reverse(); // dari yang paling lama ke terbaru
  }

  useEffect(() => {
    if (!valid) {
      setJumlah(0);
      return;
    }
    ambilDaftar()
      .then((d) => setJumlah(d.length))
      .catch(() => {});
  }, [mulai, akhir, kategori]);

  function preset(m: string, k: string) {
    setMulai(m);
    setAkhir(k);
  }

  function konfirmasi() {
    Alert.alert(
      'Sebelum dibagikan',
      'PDF memuat foto, nama tempat, kota, tanggal, dan catatan. Koordinat tidak disertakan. Bagikan hanya ke orang yang kamu percaya.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Buat PDF', onPress: proses },
      ]
    );
  }

  async function proses() {
    setSibuk(true);
    try {
      const daftar = await ambilDaftar();
      const rentang =
        !mulai.trim() && !akhir.trim()
          ? 'Semua tanggal'
          : `${mulai.trim() || 'awal'} sampai ${akhir.trim() || 'sekarang'}`;
      const html = await buatHtml(db, daftar, opsi, rentang);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Bagikan jurnal',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF dibuat', 'Menu berbagi tidak tersedia di perangkat ini.');
      }
    } catch {
      Alert.alert('Gagal membuat PDF', 'Terjadi masalah saat membuat PDF. Coba lagi, atau kurangi jumlah entri.');
    }
    setSibuk(false);
  }

  const input = [s.input, { backgroundColor: warna.kartu, borderColor: warna.garis, color: warna.teks }];

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

  const baris = (label: string, kunci: keyof OpsiPdf) => (
    <View style={s.barisSwitch} key={kunci}>
      <Text style={{ color: warna.teks, flex: 1 }}>{label}</Text>
      <Switch
        value={opsi[kunci]}
        onValueChange={(v) => setOpsi((o) => ({ ...o, [kunci]: v }))}
        trackColor={{ true: warna.aksen }}
      />
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: warna.latar }} contentContainerStyle={s.isi} keyboardShouldPersistTaps="handled">
      <Text style={[s.judul, { color: warna.teks, marginTop: 0 }]}>Rentang tanggal</Text>
      <View style={s.barisChip}>
        {chip('Semua', false, () => preset('', ''))}
        {chip('30 hari', false, () => preset(hariLalu(30), fmt(new Date())))}
        {chip('3 bulan', false, () => preset(hariLalu(90), fmt(new Date())))}
        {chip('Tahun ini', false, () => preset(`${new Date().getFullYear()}-01-01`, fmt(new Date())))}
      </View>
      <View style={s.barisTgl}>
        <TextInput
          style={[...input, { flex: 1 }]}
          value={mulai}
          onChangeText={setMulai}
          placeholder="Dari: 2026-11-01"
          placeholderTextColor={warna.teksRedup}
          keyboardType="numbers-and-punctuation"
        />
        <TextInput
          style={[...input, { flex: 1 }]}
          value={akhir}
          onChangeText={setAkhir}
          placeholder="Sampai: 2026-11-30"
          placeholderTextColor={warna.teksRedup}
          keyboardType="numbers-and-punctuation"
        />
      </View>
      {!valid && (
        <Text style={{ color: '#C0392B', fontSize: 12, marginTop: 6 }}>
          Format tanggal harus tahun-bulan-tanggal (contoh 2026-11-01), dan tanggal awal tidak boleh setelah tanggal akhir.
        </Text>
      )}

      <Text style={[s.judul, { color: warna.teks }]}>Kategori</Text>
      <View style={s.barisChip}>
        {chip('Semua', kategori === null, () => setKategori(null))}
        {DAFTAR_KATEGORI.map((k) => chip(k, kategori === k, () => setKategori(kategori === k ? null : k)))}
      </View>

      <Text style={[s.judul, { color: warna.teks }]}>Isi PDF</Text>
      <View style={[s.panel, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
        {baris('Foto', 'foto')}
        {baris('Cuaca saat kunjungan', 'cuaca')}
        {baris('Catatan dan rating', 'catatan')}
        {baris('Info Wikipedia', 'wiki')}
      </View>
      <Text style={{ color: warna.teksRedup, fontSize: 12, marginTop: 8 }}>
        Koordinat lokasi tidak pernah dimasukkan ke PDF.
      </Text>

      <View style={[s.ringkas, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
        <Text style={{ color: warna.teks, fontWeight: '700' }}>{jumlah} entri akan diekspor</Text>
      </View>

      <Pressable
        disabled={sibuk || !valid || jumlah === 0}
        onPress={konfirmasi}
        style={[s.tombol, { backgroundColor: warna.aksen, opacity: sibuk || !valid || jumlah === 0 ? 0.5 : 1 }]}
      >
        {sibuk ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={s.teksTombol}>Buat dan Bagikan PDF</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  isi: { padding: 16, paddingBottom: 40 },
  judul: { fontSize: 15, fontWeight: '700', marginTop: 22, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  barisTgl: { flexDirection: 'row', gap: 10, marginTop: 10 },
  barisChip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  panel: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  barisSwitch: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  ringkas: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 20, alignItems: 'center' },
  tombol: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  teksTombol: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});