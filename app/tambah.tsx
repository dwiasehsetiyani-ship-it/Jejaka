import { useLocalSearchParams } from 'expo-router';
import FormEntri from '../src/components/FormEntri';

export default function Tambah() {
  const p = useLocalSearchParams<{ wid?: string; nama?: string; kota?: string; lat?: string; lon?: string }>();
  const lat = Number(p.lat);
  const lon = Number(p.lon);
  const prefill =
    p.wid && p.nama && isFinite(lat) && isFinite(lon)
      ? { nama: p.nama, kota: p.kota ?? '', latitude: lat, longitude: lon }
      : undefined;
  return <FormEntri prefill={prefill} wishlistId={p.wid} />;
}