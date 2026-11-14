import type { SQLiteDatabase } from 'expo-sqlite';
import { buatId } from '../utils/id';

export type ItemWishlist = {
  id: string;
  nama_tempat: string;
  kota: string;
  latitude: number | null;
  longitude: number | null;
  status: 'ingin' | 'sudah';
  dibuat_pada: string;
};

// Hanya yang masih ingin dikunjungi. Yang sudah dikunjungi hilang dari daftar.
export function daftarWishlist(db: SQLiteDatabase) {
  return db.getAllAsync<ItemWishlist>(
    `SELECT * FROM wishlist WHERE status = 'ingin' ORDER BY dibuat_pada DESC`
  );
}

export async function tambahWishlist(
  db: SQLiteDatabase,
  d: { nama_tempat: string; kota: string; latitude: number; longitude: number }
) {
  await db.runAsync(
    `INSERT INTO wishlist (id, nama_tempat, kota, latitude, longitude, status, dibuat_pada)
     VALUES (?, ?, ?, ?, ?, 'ingin', ?)`,
    [buatId(), d.nama_tempat, d.kota, d.latitude, d.longitude, new Date().toISOString()]
  );
}

export async function hapusWishlist(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM wishlist WHERE id = ?', id);
}

export async function tandaiSudah(db: SQLiteDatabase, id: string) {
  await db.runAsync(`UPDATE wishlist SET status = 'sudah' WHERE id = ?`, id);
}