import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const KUNCI = 'pengaturan:kunci';
const JEDA_MS = 60_000;

type Ctx = {
  siap: boolean;
  aktif: boolean;
  terkunci: boolean;
  tersedia: boolean;
  bukaKunci: () => Promise<boolean>;
  ubahKunci: (nyala: boolean) => Promise<boolean>;
};

const KunciCtx = createContext<Ctx>({
  siap: true,
  aktif: false,
  terkunci: false,
  tersedia: true,
  bukaKunci: async () => true,
  ubahKunci: async () => false,
});

export function KunciProvider({ children }: { children: ReactNode }) {
  const [siap, setSiap] = useState(false);
  const [aktif, setAktif] = useState(false);
  const [terkunci, setTerkunci] = useState(false);
  const [tersedia, setTersedia] = useState(true);
  const sedangAuth = useRef(false);
  const waktuLatar = useRef<number | null>(null);
  const aktifRef = useRef(false);

  // Perangkat harus punya biometrik atau PIN/pola/sandi layar.
  const cekTersedia = useCallback(async () => {
    try {
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      const ada = level !== LocalAuthentication.SecurityLevel.NONE;
      setTersedia(ada);
      return ada;
    } catch {
      setTersedia(false);
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(KUNCI).catch(() => null);
      let nyala = v === '1';
      const ada = await cekTersedia();
      // Kalau PIN perangkat sudah dihapus, kunci dimatikan supaya pengguna tidak terkunci selamanya.
      if (nyala && !ada) {
        nyala = false;
        await AsyncStorage.setItem(KUNCI, '0').catch(() => {});
      }
      aktifRef.current = nyala;
      setAktif(nyala);
      setTerkunci(nyala);
      setSiap(true);
    })();
  }, [cekTersedia]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') {
        if (!sedangAuth.current) waktuLatar.current = Date.now();
      } else if (s === 'active') {
        cekTersedia();
        const t = waktuLatar.current;
        waktuLatar.current = null;
        if (aktifRef.current && t !== null && Date.now() - t > JEDA_MS) setTerkunci(true);
      }
    });
    return () => sub.remove();
  }, [cekTersedia]);

  const autentikasi = useCallback(async (pesan: string) => {
    if (sedangAuth.current) return false;
    sedangAuth.current = true;
    try {
      const h = await LocalAuthentication.authenticateAsync({
        promptMessage: pesan,
        cancelLabel: 'Batal',
      });
      return h.success;
    } catch {
      return false;
    } finally {
      sedangAuth.current = false;
    }
  }, []);

  const bukaKunci = useCallback(async () => {
    const ok = await autentikasi('Buka Jejaka');
    if (ok) setTerkunci(false);
    return ok;
  }, [autentikasi]);

  // Menyalakan atau mematikan kunci selalu minta verifikasi dulu.
  const ubahKunci = useCallback(
    async (nyala: boolean) => {
      if (nyala && !(await cekTersedia())) return false;
      const ok = await autentikasi(
        nyala ? 'Konfirmasi untuk menyalakan kunci aplikasi' : 'Konfirmasi untuk mematikan kunci aplikasi'
      );
      if (!ok) return false;
      aktifRef.current = nyala;
      setAktif(nyala);
      await AsyncStorage.setItem(KUNCI, nyala ? '1' : '0').catch(() => {});
      return true;
    },
    [autentikasi, cekTersedia]
  );

  return (
    <KunciCtx.Provider value={{ siap, aktif, terkunci, tersedia, bukaKunci, ubahKunci }}>
      {children}
    </KunciCtx.Provider>
  );
}

export const useKunci = () => useContext(KunciCtx);