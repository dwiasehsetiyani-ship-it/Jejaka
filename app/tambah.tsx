import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../src/theme/tema';

export default function Tambah() {
  const { warna } = useTema();
  return (
    <View style={[s.wadah, { backgroundColor: warna.latar }]}>
      <Text style={{ color: warna.teksRedup }}>Form tambah entri (Tahap 2)</Text>
    </View>
  );
}

const s = StyleSheet.create({ wadah: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
