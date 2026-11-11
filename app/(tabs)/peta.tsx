import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import BannerOffline from '../../src/components/BannerOffline';
import Bintang from '../../src/components/Bintang';
import { cariEntri } from '../../src/db/cari';
import type { EntriRingkas } from '../../src/db/entri';
import { DAFTAR_KATEGORI } from '../../src/db/tipe';
import { FILTER_KOSONG, useFilter } from '../../src/filter';
import { useTema } from '../../src/theme/tema';

const WILAYAH_AWAL = { latitude: -7.0, longitude: 110.4, latitudeDelta: 3, longitudeDelta: 3 };

export default function Peta() {
  const { warna } = useTema();
  const db = useSQLiteContext();
  const router = useRouter();
  const { filter, setFilter } = useFilter();
  const { id, t } = useLocalSearchParams<{ id?: string; t?: string }>();

  const peta = useRef<MapView>(null);
  const lewatiFit = useRef(false);
  const [data, setData] = useState<EntriRingkas[]>([]);
  const [siap, setSiap] = useState(false);
  const [pilih, setPilih] = useState<EntriRingkas | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  // Hanya entri yang punya koordinat yang tampil sebagai pin.
  useFocusEffect(
    useCallback(() => {
      cariEntri(db, filter)
        .then((r) => setData(r.filter((e) => e.latitude !== null && e.longitude !== null)))
        .catch(() => {});
    }, [db, filter])
  );

  // Dibuka dari tombol "Lihat di peta" di detail entri.
  useEffect(() => {
    if (!id) return;
    setFilter(FILTER_KOSONG);
    setTarget(id);
    router.setParams({ id: undefined, t: undefined });
  }, [id, t]);

  useEffect(() => {
    if (!siap) return;

    if (target) {
      const e = data.find((x) => x.id === target);
      if (e) {
        setPilih(e);
        peta.current?.animateToRegion(
          { latitude: e.latitude!, longitude: e.longitude!, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          400
        );
        lewatiFit.current = true;
        setTarget(null);
      }
      return;
    }

    if (lewatiFit.current) {
      lewatiFit.current = false;
      return;
    }

    setPilih((p) => (p && data.some((x) => x.id === p.id) ? p : null));
    if (data.length === 1) {
      peta.current?.animateToRegion(
        { latitude: data[0].latitude!, longitude: data[0].longitude!, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        400
      );
    } else if (data.length > 1) {
      peta.current?.fitToCoordinates(
        data.map((e) => ({ latitude: e.latitude!, longitude: e.longitude! })),
        { edgePadding: { top: 120, right: 60, bottom: 200, left: 60 }, animated: true }
      );
    }
  }, [data, siap, target]);

  function chip(label: string, aktif: boolean, onPress: () => void) {
    return (
      <Pressable
        key={label}
        onPress={onPress}
        style={[s.chip, { backgroundColor: aktif ? warna.aksen : warna.kartu, borderColor: warna.aksen }]}
      >
        <Text style={{ color: aktif ? '#FFFFFF' : warna.aksen, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: warna.latar }}>
      <BannerOffline />
      <View style={{ flex: 1 }}>
        <MapView
          ref={peta}
          style={StyleSheet.absoluteFill}
          initialRegion={WILAYAH_AWAL}
          onMapReady={() => setSiap(true)}
          onPress={() => setPilih(null)}
        >
          {data.map((e) => (
            <Marker
              key={e.id}
              coordinate={{ latitude: e.latitude!, longitude: e.longitude! }}
              pinColor={warna.aksen}
              onPress={() => setPilih(e)}
            />
          ))}
        </MapView>

        <View style={s.atas} pointerEvents="box-none">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.barisChip}>
            {chip('Semua', filter.kategori === null, () => setFilter((f) => ({ ...f, kategori: null })))}
            {DAFTAR_KATEGORI.map((k) =>
              chip(k, filter.kategori === k, () => setFilter((f) => ({ ...f, kategori: f.kategori === k ? null : k })))
            )}
          </ScrollView>
          <View style={[s.jumlah, { backgroundColor: warna.kartu, borderColor: warna.garis }]}>
            <Text style={{ color: warna.teks, fontSize: 12, fontWeight: '600' }}>{data.length} tempat</Text>
          </View>
        </View>

        {data.length === 0 && (
          <View style={[s.kosong, { backgroundColor: warna.kartu, borderColor: warna.garis }]} pointerEvents="none">
            <Text style={{ color: warna.teksRedup, textAlign: 'center' }}>
              Belum ada entri dengan lokasi untuk ditampilkan.
            </Text>
          </View>
        )}

        {pilih && (
          <Pressable
            onPress={() => router.push(`/entri/${pilih.id}`)}
            style={[s.kartu, { backgroundColor: warna.kartu, borderColor: warna.garis }]}
          >
            {pilih.foto_utama ? (
              <Image source={{ uri: pilih.foto_utama }} style={s.foto} />
            ) : (
              <View style={[s.foto, s.tanpaFoto, { backgroundColor: warna.garis }]}>
                <Ionicons name="image-outline" size={24} color={warna.teksRedup} />
              </View>
            )}
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: warna.teks, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
                {pilih.nama_tempat}
              </Text>
              <Text style={{ color: warna.teksRedup, fontSize: 12 }} numberOfLines={1}>
                {[pilih.kota, new Date(pilih.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
              <Bintang nilai={pilih.rating} ukuran={14} />
            </View>
            <View style={s.detail}>
              <Text style={{ color: warna.aksen, fontWeight: '700' }}>Detail</Text>
              <Ionicons name="chevron-forward" size={16} color={warna.aksen} />
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  atas: { position: 'absolute', top: 10, left: 0, right: 0, gap: 8 },
  barisChip: { paddingHorizontal: 12, gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  jumlah: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kosong: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 30,
  },
  kartu: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    elevation: 4,
  },
  foto: { width: 64, height: 64, borderRadius: 10 },
  tanpaFoto: { alignItems: 'center', justifyContent: 'center' },
  detail: { flexDirection: 'row', alignItems: 'center' },
});