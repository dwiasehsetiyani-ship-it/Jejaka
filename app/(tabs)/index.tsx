import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../../src/theme/tema';

export default function Jurnal() {
  const { warna } = useTema();
  const router = useRouter();
  return (
    <View style={[s.wadah, { backgroundColor: warna.latar }]}>
      <Text style={[s.teks, { color: warna.teksRedup }]}>Belum ada entri. Ketuk + untuk mulai.</Text>
      <Pressable style={[s.fab, { backgroundColor: warna.aksen }]} onPress={() => router.push('/tambah')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wadah: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  teks: { fontSize: 15 },
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
