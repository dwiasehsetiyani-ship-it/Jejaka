import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';

export default function BannerOffline() {
  const net = useNetInfo();
  const offline = net.isConnected === false || net.isInternetReachable === false;
  if (!offline) return null;
  return (
    <View style={s.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color="#5C4400" />
      <Text style={s.teks}>Tanpa internet. Entri lama tetap bisa dibuka.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#E0A100',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  teks: { color: '#5C4400', fontSize: 13, flex: 1 },
});