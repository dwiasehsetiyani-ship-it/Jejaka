import type { Titik } from './lokasi';

export type Cuaca = { suhu: number; kondisi: string };

const KODE: Record<number, string> = {
  0: 'Cerah',
  1: 'Cerah berawan',
  2: 'Berawan sebagian',
  3: 'Berawan',
  45: 'Berkabut',
  48: 'Berkabut',
  51: 'Gerimis ringan',
  53: 'Gerimis',
  55: 'Gerimis lebat',
  56: 'Gerimis beku',
  57: 'Gerimis beku',
  61: 'Hujan ringan',
  63: 'Hujan',
  65: 'Hujan lebat',
  66: 'Hujan beku',
  67: 'Hujan beku',
  71: 'Salju ringan',
  73: 'Salju',
  75: 'Salju lebat',
  77: 'Butiran salju',
  80: 'Hujan lokal ringan',
  81: 'Hujan lokal',
  82: 'Hujan lokal lebat',
  85: 'Hujan salju ringan',
  86: 'Hujan salju lebat',
  95: 'Badai petir',
  96: 'Badai petir dan hujan es',
  99: 'Badai petir dan hujan es',
};

export function namaKondisi(kode: number) {
  return KODE[kode] ?? 'Tidak diketahui';
}

function bulat2(n: number) {
  return Math.round(n * 100) / 100;
}

function tanggalLokal(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function ambilJson(url: string) {
  const kontrol = new AbortController();
  const timer = setTimeout(() => kontrol.abort(), 8000);
  try {
    const res = await fetch(url, { signal: kontrol.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Cuaca untuk titik dan waktu kunjungan. Null kalau gagal (misalnya offline).
export async function ambilCuaca(t: Titik, waktuISO: string): Promise<Cuaca | null> {
  const lat = bulat2(t.latitude);
  const lon = bulat2(t.longitude);
  const waktu = new Date(waktuISO);
  const selisihJam = (Date.now() - waktu.getTime()) / 3600000;

  // Kunjungan baru saja (kurang dari 3 jam lalu): cuaca saat ini
  if (selisihJam < 3) {
    const j = await ambilJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code&timezone=auto`
    );
    const c = j?.current;
    if (!c || typeof c.temperature_2m !== 'number') return null;
    return { suhu: Math.round(c.temperature_2m), kondisi: namaKondisi(c.weather_code) };
  }

  // Kunjungan lama: cuaca per jam pada tanggal itu
  const tanggal = tanggalLokal(waktu);
  const selisihHari = selisihJam / 24;
  const dasar =
    selisihHari <= 90
      ? 'https://api.open-meteo.com/v1/forecast'
      : 'https://archive-api.open-meteo.com/v1/archive';
  const j = await ambilJson(
    `${dasar}?latitude=${lat}&longitude=${lon}&start_date=${tanggal}&end_date=${tanggal}` +
      `&hourly=temperature_2m,weather_code&timezone=auto`
  );
  const h = j?.hourly;
  const i = waktu.getHours();
  if (!h || typeof h.temperature_2m?.[i] !== 'number') return null;
  return { suhu: Math.round(h.temperature_2m[i]), kondisi: namaKondisi(h.weather_code[i]) };
}