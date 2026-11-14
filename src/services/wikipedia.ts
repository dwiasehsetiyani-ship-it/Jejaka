import { USER_AGENT, type Titik } from './lokasi';

export type HasilWiki =
  | { status: 'ada'; judul: string; ringkasan: string }
  | { status: 'tidakAda' }
  | { status: 'gagal' };

// Kata umum yang tidak boleh jadi satu-satunya alasan dua nama dianggap cocok.
const UMUM = new Set([
  'pantai', 'candi', 'museum', 'taman', 'warung', 'rumah', 'makan', 'kedai', 'masjid',
  'bukit', 'gunung', 'kebun', 'wisata', 'desa', 'kota', 'jalan', 'pasar', 'toko', 'danau',
  'curug', 'air', 'terjun', 'kampung', 'pusat', 'alun',
]);

function kata(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((k) => k.length >= 4 && !UMUM.has(k));
}

function cocok(judul: string, nama: string) {
  const a = judul.toLowerCase().trim();
  const b = nama.toLowerCase().trim();
  if (!b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const kb = new Set(kata(nama));
  return kata(judul).some((k) => kb.has(k));
}

async function ambil(url: string): Promise<any | undefined> {
  const kontrol = new AbortController();
  const timer = setTimeout(() => kontrol.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT },
      signal: kontrol.signal,
    });
    if (!res.ok) return undefined;
    return await res.json();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

// Cari artikel Wikipedia di sekitar titik (radius 1 km) yang judulnya cocok dengan nama tempat.
export async function cariWikipedia(t: Titik, namaTempat: string): Promise<HasilWiki> {
  const lat = t.latitude.toFixed(3);
  const lon = t.longitude.toFixed(3);
  const g = await ambil(
    `https://id.wikipedia.org/w/api.php?action=query&list=geosearch` +
      `&gscoord=${lat}%7C${lon}&gsradius=1000&gslimit=3&format=json`
  );
  if (!g) return { status: 'gagal' };

  const hasil: { title: string }[] = g.query?.geosearch ?? [];
  const pilih = hasil.find((h) => cocok(h.title, namaTempat));
  if (!pilih) return { status: 'tidakAda' };

  const r = await ambil(
    `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pilih.title.replace(/ /g, '_'))}`
  );
  if (!r || typeof r.extract !== 'string') return { status: 'gagal' };
  if (r.type === 'disambiguation' || !r.extract.trim()) return { status: 'tidakAda' };
  return { status: 'ada', judul: r.title ?? pilih.title, ringkasan: r.extract.trim() };
}