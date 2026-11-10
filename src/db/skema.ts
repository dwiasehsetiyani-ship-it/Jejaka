import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrasi(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS entri (
      id TEXT PRIMARY KEY NOT NULL,
      nama_tempat TEXT NOT NULL DEFAULT '',
      kota TEXT NOT NULL DEFAULT '',
      kategori TEXT NOT NULL DEFAULT 'alam',
      rating INTEGER NOT NULL DEFAULT 0,
      catatan TEXT NOT NULL DEFAULT '',
      latitude REAL,
      longitude REAL,
      tanggal_kunjungan TEXT NOT NULL,
      suhu REAL,
      kondisi_cuaca TEXT,
      status_cuaca TEXT NOT NULL DEFAULT 'menunggu',
      wiki_judul TEXT,
      wiki_ringkasan TEXT,
      dibuat_pada TEXT NOT NULL,
      diubah_pada TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS foto (
      id TEXT PRIMARY KEY NOT NULL,
      entri_id TEXT NOT NULL,
      path_berkas TEXT NOT NULL,
      urutan INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (entri_id) REFERENCES entri(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY NOT NULL,
      nama_tempat TEXT NOT NULL,
      kota TEXT NOT NULL DEFAULT '',
      latitude REAL,
      longitude REAL,
      status TEXT NOT NULL DEFAULT 'ingin',
      dibuat_pada TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cache_geocode (
      kunci TEXT PRIMARY KEY NOT NULL,
      nama_tempat TEXT NOT NULL DEFAULT '',
      kota TEXT NOT NULL DEFAULT '',
      disimpan_pada TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entri_tanggal ON entri(tanggal_kunjungan DESC);
    CREATE INDEX IF NOT EXISTS idx_entri_kategori ON entri(kategori);
    CREATE INDEX IF NOT EXISTS idx_foto_entri ON foto(entri_id);
  `);
}
