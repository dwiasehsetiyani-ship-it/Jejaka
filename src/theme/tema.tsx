import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type PilihanTema = 'terang' | 'gelap' | 'sistem';

const terang = {
  latar: '#FBF6F1',
  kartu: '#FFFFFF',
  teks: '#2B1B12',
  teksRedup: '#8A7566',
  aksen: '#B5471B',
  garis: '#EADCCF',
};
const gelap = {
  latar: '#1C1410',
  kartu: '#2A1F19',
  teks: '#F5EBE3',
  teksRedup: '#B8A596',
  aksen: '#E0703F',
  garis: '#3D2E25',
};

export type Warna = typeof terang;

type TemaCtx = {
  warna: Warna;
  gelap: boolean;
  pilihan: PilihanTema;
  setPilihan: (p: PilihanTema) => void;
};

const Ctx = createContext<TemaCtx>({
  warna: terang,
  gelap: false,
  pilihan: 'sistem',
  setPilihan: () => {},
});

const KUNCI = 'pengaturan:tema';

export function TemaProvider({ children }: { children: ReactNode }) {
  const sistem = useColorScheme();
  const [pilihan, setPilihanState] = useState<PilihanTema>('sistem');

  useEffect(() => {
    AsyncStorage.getItem(KUNCI)
      .then((v) => {
        if (v === 'terang' || v === 'gelap' || v === 'sistem') setPilihanState(v);
      })
      .catch(() => {});
  }, []);

  const setPilihan = (p: PilihanTema) => {
    setPilihanState(p);
    AsyncStorage.setItem(KUNCI, p).catch(() => {});
  };

  const pakaiGelap = pilihan === 'gelap' || (pilihan === 'sistem' && sistem === 'dark');

  return (
    <Ctx.Provider
      value={{ warna: pakaiGelap ? gelap : terang, gelap: pakaiGelap, pilihan, setPilihan }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useTema = () => useContext(Ctx);
