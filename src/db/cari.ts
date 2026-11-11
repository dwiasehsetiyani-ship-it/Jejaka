import type { SQLiteDatabase } from 'expo-sqlite';
import type { EntriRingkas } from './entri';
import type { Kategori } from './tipe';

export type Filter = { kategori: Kategori | null; kota: string | null; teks: string };

export function cariEntri(db: SQLiteDatabase, f: Filter) {
  const where: string[] = [];
  const param: string[] = [];
  if (f.kategori) {
    where.push('e.kategori = ?');
    param.push(f.kategori);
  }
  if (f.kota) {
    where.push('e.kota = ?');
    param.push(f.kota);
  }
  const teks = f.teks.trim();
  if (teks) {
    where.push('(e.nama_tempat LIKE ? OR e.catatan LIKE ?)');
    param.push(`%${teks}%`, `%${teks}%`);
  }
  const sql = `SELECT e.*,
      (SELECT path_berkas FROM foto WHERE entri_id = e.id ORDER BY urutan LIMIT 1) AS foto_utama
    FROM entri e
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY e.tanggal_kunjungan DESC`;
  return db.getAllAsync<EntriRingkas>(sql, param);
}

export async function daftarKota(db: SQLiteDatabase): Promise<string[]> {
  const r = await db.getAllAsync<{ kota: string }>(
    `SELECT DISTINCT kota FROM entri WHERE kota != '' ORDER BY kota`
  );
  return r.map((x) => x.kota);
}