import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PilihanTema, useTema } from '../src/theme/tema';

const OPSI: { nilai: PilihanTema; label: string }[] = [
  { nilai: 'terang', label: 'Terang' },
  { nilai: 'gelap', label: 'Gelap' },
  { nilai: 'sistem', label: 'Sistem' },
];

export default function Pengaturan() {
  const { warna, pilihan, setPilihan } = useTema();
  return (
    <View style={[s.wadah, { backgroundColor: warna.latar }]}>
      <Text style={[s.judul, { color: warna.teks }]}>Tampilan</Text>
      <View style={[s.baris, { borderColor: warna.garis, backgroundColor: warna.kartu }]}>
        {OPSI.map((o) => {
          const aktif = pilihan === o.nilai;
          return (
            <Pressable
              key={o.nilai}
              onPress={() => setPilihan(o.nilai)}
              style={[s.opsi, aktif && { backgroundColor: warna.aksen }]}
            >
              <Text style={{ color: aktif ? '#FFFFFF' : warna.teks, fontWeight: '600' }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wadah: { flex: 1, padding: 16 },
  judul: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  baris: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4 },
  opsi: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
});
