import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import FormEntri from '../../../src/components/FormEntri';
import { ambilEntri, ambilFoto } from '../../../src/db/entri';
import type { Entri } from '../../../src/db/tipe';
import { useTema } from '../../../src/theme/tema';

export default function UbahEntri() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { warna } = useTema();
  const [entri, setEntri] = useState<Entri | null>(null);
  const [foto, setFoto] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const e = await ambilEntri(db, id);
      if (e) {
        setFoto((await ambilFoto(db, id)).map((f) => f.path_berkas));
        setEntri(e);
      }
    })().catch(() => {});
  }, [db, id]);

  if (!entri) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: warna.latar }}>
        <Text style={{ color: warna.teksRedup }}>Memuat...</Text>
      </View>
    );
  }
  return <FormEntri awal={entri} fotoAwal={foto} />;
}