import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../../src/theme/tema';

export default function Statistik() {
  const { warna } = useTema();
  return (
    <View style={[s.wadah, { backgroundColor: warna.latar }]}>
      <Text style={{ color: warna.teksRedup }}>Layar Statistik (dikerjakan di tahap berikutnya)</Text>
    </View>
  );
}

const s = StyleSheet.create({ wadah: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
