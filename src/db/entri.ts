import type { SQLiteDatabase } from 'expo-sqlite';
import { ambilCuaca } from '../services/cuaca';
import { hapusBerkas, salinKeDokumen } from '../utils/foto';
import { buatId } from '../utils/id';
import type { Entri, Foto, Kategori } from './tipe';

export type EntriRingkas = Entri & { foto_utama: string | null };

export type DataForm = {
  nama_tempat: string;
  kota: string;
  kategori: Kategori;
  rating: number;
  catatan: string;
  tanggal_kunjungan: string;
  latitude: number | null;
  longitude: number | null;
  suhu: number | null;
  kondisi_cuaca: string | null;
};

// baru = true: foto baru dari kamera/galeri, belum disalin ke penyimpanan permanen
export type FotoForm = { uri: string; baru: boolean };

export function daftarEntri(db: SQLiteDatabase) {
  return db.getAllAsync<EntriRingkas>(
    `SELECT e.*,
       (SELECT path_berkas FROM foto WHERE entri_id = e.id ORDER BY urutan LIMIT 1) AS foto_utama
     FROM entri e
     ORDER BY e.tanggal_kunjungan DESC`
  );
}

export function ambilEntri(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Entri>('SELECT * FROM entri WHERE id = ?', id);
}

export function ambilFoto(db: SQLiteDatabase, id: string) {
  return db.getAllAsync<Foto>('SELECT * FROM foto WHERE entri_id = ? ORDER BY urutan', id);
}

export async function simpanEntri(db: SQLiteDatabase, data: DataForm, foto: FotoForm[]) {
  const id = buatId();
  const sekarang = new Date().toISOString();
  const berkas = foto.map((f) => salinKeDokumen(f.uri));
  const statusCuaca = data.suhu !== null ? 'terisi' : 'menunggu';
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO entri (id, nama_tempat, kota, kategori, rating, catatan, latitude, longitude,
         tanggal_kunjungan, suhu, kondisi_cuaca, status_cuaca, dibuat_pada, diubah_pada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.nama_tempat, data.kota, data.kategori, data.rating, data.catatan,
        data.latitude, data.longitude, data.tanggal_kunjungan, data.suhu, data.kondisi_cuaca,
        statusCuaca, sekarang, sekarang,
      ]
    );
    for (let i = 0; i < berkas.length; i++) {
      await db.runAsync('INSERT INTO foto (id, entri_id, path_berkas, urutan) VALUES (?, ?, ?, ?)', [
        buatId(), id, berkas[i], i,
      ]);
    }
  });
  return id;
}

// Cuaca, koordinat, dan tanggal tidak diubah di sini: cuaca tidak berubah lagi setelah tersimpan.
export async function ubahEntri(db: SQLiteDatabase, id: string, data: DataForm, foto: FotoForm[]) {
  const lama = await ambilFoto(db, id);
  const dipakai = new Set(foto.filter((f) => !f.baru).map((f) => f.uri));
  const dibuang = lama.filter((f) => !dipakai.has(f.path_berkas));
  const berkas = foto.map((f) => (f.baru ? salinKeDokumen(f.uri) : f.uri));
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE entri SET nama_tempat = ?, kota = ?, kategori = ?, rating = ?, catatan = ?, diubah_pada = ? WHERE id = ?`,
      [data.nama_tempat, data.kota, data.kategori, data.rating, data.catatan, new Date().toISOString(), id]
    );
    await db.runAsync('DELETE FROM foto WHERE entri_id = ?', id);
    for (let i = 0; i < berkas.length; i++) {
      await db.runAsync('INSERT INTO foto (id, entri_id, path_berkas, urutan) VALUES (?, ?, ?, ?)', [
        buatId(), id, berkas[i], i,
      ]);
    }
  });
  dibuang.forEach((f) => hapusBerkas(f.path_berkas));
}

// Hapus entri sekaligus berkas fotonya dari penyimpanan.
export async function hapusEntri(db: SQLiteDatabase, id: string) {
  const foto = await ambilFoto(db, id);
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM foto WHERE entri_id = ?', id);
    await db.runAsync('DELETE FROM entri WHERE id = ?', id);
  });
  foto.forEach((f) => hapusBerkas(f.path_berkas));
}

// Isi cuaca untuk entri yang masih "menunggu" (dibuat saat offline). Mengembalikan jumlah yang terisi.
export async function isiCuacaTertunda(db: SQLiteDatabase): Promise<number> {
  const antre = await db.getAllAsync<Entri>(
    `SELECT * FROM entri WHERE status_cuaca = 'menunggu' AND latitude IS NOT NULL AND longitude IS NOT NULL`
  );
  let terisi = 0;
  for (const e of antre) {
    const c = await ambilCuaca({ latitude: e.latitude!, longitude: e.longitude! }, e.tanggal_kunjungan);
    if (!c) continue;
    await db.runAsync(
      `UPDATE entri SET suhu = ?, kondisi_cuaca = ?, status_cuaca = 'terisi' WHERE id = ? AND status_cuaca = 'menunggu'`,
      [c.suhu, c.kondisi, e.id]
    );
    terisi++;
  }
  return terisi;
}