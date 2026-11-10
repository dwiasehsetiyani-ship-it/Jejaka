import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type Props = { onSelesai: () => void };

export default function Splash({ onSelesai }: Props) {
  const muncul = useRef(new Animated.Value(0)).current;
  const skala = useRef(new Animated.Value(0.8)).current;
  const keluar = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(muncul, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(skala, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(900),
      Animated.timing(keluar, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onSelesai());
  }, []);

  return (
    <Animated.View style={[s.wadah, { opacity: keluar }]}>
      <Animated.View style={{ alignItems: 'center', opacity: muncul, transform: [{ scale: skala }] }}>
        <View style={s.lingkaran}>
          <Ionicons name="location" size={56} color="#FFFFFF" />
        </View>
        <Text style={s.nama}>Jejaka</Text>
        <Text style={s.tagline}>Jurnal perjalananmu, terisi sendiri</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wadah: { flex: 1, backgroundColor: '#B5471B', alignItems: 'center', justifyContent: 'center' },
  lingkaran: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  nama: { fontSize: 38, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
});