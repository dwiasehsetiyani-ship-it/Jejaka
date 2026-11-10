import type { SQLiteDatabase } from 'expo-sqlite';
import { buatId } from '../utils/id';
import { hapusBerkas, salinKeDokumen } from '../utils/foto';
import type { Entri, Foto, Kategori } from './tipe';

export type EntriRingkas = Entri & { foto_utama: string | null };

export type DataForm = {
  nama_tempat: string;
  kota: string;
  kategori: Kategori;
  rating: number;
  catatan: string;
  tanggal_kunjungan: string;
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
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO entri (id, nama_tempat, kota, kategori, rating, catatan, tanggal_kunjungan, status_cuaca, dibuat_pada, diubah_pada)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'menunggu', ?, ?)`,
      [id, data.nama_tempat, data.kota, data.kategori, data.rating, data.catatan, data.tanggal_kunjungan, sekarang, sekarang]
    );
    for (let i = 0; i < berkas.length; i++) {
      await db.runAsync('INSERT INTO foto (id, entri_id, path_berkas, urutan) VALUES (?, ?, ?, ?)', [
        buatId(),
        id,
        berkas[i],
        i,
      ]);
    }
  });
  return id;
}

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
        buatId(),
        id,
        berkas[i],
        i,
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