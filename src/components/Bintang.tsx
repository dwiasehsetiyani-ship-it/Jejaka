import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

type Props = { nilai: number; onUbah?: (n: number) => void; ukuran?: number };

export default function Bintang({ nilai, onUbah, ukuran = 22 }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onUbah} onPress={() => onUbah?.(n === nilai ? 0 : n)} hitSlop={6}>
          <Ionicons name={n <= nilai ? 'star' : 'star-outline'} size={ukuran} color="#E0A100" />
        </Pressable>
      ))}
    </View>
  );
}