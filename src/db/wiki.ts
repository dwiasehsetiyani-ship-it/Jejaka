import type { SQLiteDatabase } from 'expo-sqlite';

export async function simpanWiki(db: SQLiteDatabase, id: string, judul: string, ringkasan: string) {
  await db.runAsync('UPDATE entri SET wiki_judul = ?, wiki_ringkasan = ? WHERE id = ?', [
    judul,
    ringkasan,
    id,
  ]);
}