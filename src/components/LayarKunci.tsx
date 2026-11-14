import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useKunci } from '../kunci';

export default function LayarKunci() {
  const { terkunci, bukaKunci } = useKunci();
  return (
    <Modal
      visible={terkunci}
      animationType="fade"
      onRequestClose={() => {}}
      onShow={() => {
        bukaKunci();
      }}
    >
      <View style={s.wadah}>
        <View style={s.lingkaran}>
          <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
        </View>
        <Text style={s.judul}>Jejaka terkunci</Text>
        <Text style={s.teks}>Verifikasi dulu untuk membuka jurnalmu.</Text>
        <Pressable onPress={() => bukaKunci()} style={s.tombol}>
          <Text style={s.teksTombol}>Buka kunci</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wadah: { flex: 1, backgroundColor: '#B5471B', alignItems: 'center', justifyContent: 'center', padding: 30 },
  lingkaran: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  judul: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  teks: { color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' },
  tombol: {
    marginTop: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  teksTombol: { color: '#B5471B', fontWeight: '800', fontSize: 16 },
});