import type { SQLiteDatabase } from 'expo-sqlite';
import { hapusSemuaFoto } from '../utils/penyimpanan';

export async function hapusSemuaData(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (const tabel of ['foto', 'entri', 'wishlist', 'cache_geocode']) {
      await db.runAsync(`DELETE FROM ${tabel}`);
    }
  });
  hapusSemuaFoto();
}