import * as Location from 'expo-location';
import type { SQLiteDatabase } from 'expo-sqlite';

export type Titik = { latitude: number; longitude: number };
export type Tempat = { nama_tempat: string; kota: string };
export type HasilPosisi = { titik: Titik | null; ditolak: boolean };

// GANTI email di bawah dengan emailmu. Nominatim mewajibkan User-Agent yang bisa dihubungi.
const USER_AGENT = 'Jejaka/1.0 (tugas kuliah PBP; dwiasehsetiyani@gmail.com)';

function kunci(t: Titik) {
  return `${t.latitude.toFixed(3)},${t.longitude.toFixed(3)}`;
}

// Posisi GPS saat ini. ditolak = true kalau izin lokasi ditolak.
export async function posisiSaatIni(): Promise<HasilPosisi> {
  const izin = await Location.requestForegroundPermissionsAsync();
  if (!izin.granted) return { titik: null, ditolak: true };
  try {
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { titik: { latitude: p.coords.latitude, longitude: p.coords.longitude }, ditolak: false };
  } catch {
    return { titik: null, ditolak: false };
  }
}

// Baca koordinat dari metadata (EXIF) foto galeri.
export function titikDariExif(exif: Record<string, any> | null | undefined): Titik | null {
  if (!exif) return null;
  let lat = Number(exif.GPSLatitude);
  let lon = Number(exif.GPSLongitude);
  if (!isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0)) return null;
  if (String(exif.GPSLatitudeRef).toUpperCase() === 'S' && lat > 0) lat = -lat;
  if (String(exif.GPSLongitudeRef).toUpperCase() === 'W' && lon > 0) lon = -lon;
  return { latitude: lat, longitude: lon };
}

// Baca tanggal foto dari EXIF, contoh "2026:11:03 14:22:10". Hasil: ISO string atau null.
export function waktuDariExif(exif: Record<string, any> | null | undefined): string | null {
  const mentah = exif?.DateTimeOriginal ?? exif?.DateTime;
  if (typeof mentah !== 'string') return null;
  const m = mentah.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// --- Nominatim: antrean 1 permintaan per detik ---
let terakhirNominatim = 0;

async function nominatim(t: Titik): Promise<Tempat> {
  const tunggu = terakhirNominatim + 1100 - Date.now();
  if (tunggu > 0) await new Promise((r) => setTimeout(r, tunggu));
  terakhirNominatim = Date.now();

  const kontrol = new AbortController();
  const timer = setTimeout(() => kontrol.abort(), 8000);
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=id` +
      `&lat=${t.latitude}&lon=${t.longitude}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: kontrol.signal });
    if (!res.ok) return { nama_tempat: '', kota: '' };
    const j = await res.json();
    const a = j.address ?? {};
    return {
      nama_tempat: j.name ?? '',
      kota: a.city ?? a.town ?? a.county ?? a.state ?? '',
    };
  } catch {
    return { nama_tempat: '', kota: '' };
  } finally {
    clearTimeout(timer);
  }
}

// Geocoder bawaan perangkat.
async function geocoderPerangkat(t: Titik): Promise<Tempat> {
  try {
    const hasil = await Location.reverseGeocodeAsync(t);
    const a = hasil[0];
    if (!a) return { nama_tempat: '', kota: '' };
    // name sering berisi nomor jalan atau nama jalan, itu bukan nama tempat
    const bukanTempat = !a.name || /^\d/.test(a.name) || a.name === a.street;
    return {
      nama_tempat: bukanTempat ? '' : a.name!,
      kota: a.city ?? a.subregion ?? a.region ?? '',
    };
  } catch {
    return { nama_tempat: '', kota: '' };
  }
}

// Nama tempat dan kota untuk satu titik: cache -> perangkat -> Nominatim.
export async function isiTempat(db: SQLiteDatabase, t: Titik, online: boolean): Promise<Tempat> {
  const k = kunci(t);
  const cache = await db.getFirstAsync<Tempat>(
    'SELECT nama_tempat, kota FROM cache_geocode WHERE kunci = ?',
    k
  );
  if (cache) return cache;

  let hasil = await geocoderPerangkat(t);
  if ((!hasil.nama_tempat || !hasil.kota) && online) {
    const cadangan = await nominatim(t);
    hasil = {
      nama_tempat: hasil.nama_tempat || cadangan.nama_tempat,
      kota: hasil.kota || cadangan.kota,
    };
  }

  if (hasil.nama_tempat || hasil.kota) {
    await db.runAsync(
      'INSERT OR REPLACE INTO cache_geocode (kunci, nama_tempat, kota, disimpan_pada) VALUES (?, ?, ?, ?)',
      [k, hasil.nama_tempat, hasil.kota, new Date().toISOString()]
    );
  }
  return hasil;
}