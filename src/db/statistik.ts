import type { SQLiteDatabase } from 'expo-sqlite';

export type Statistik = {
  jumlahTempat: number;
  jumlahKota: number;
  rataRating: number | null;
  perKategori: { kategori: string; jumlah: number }[];
  kotaTerbanyak: { kota: string; jumlah: number }[];
};

export async function ambilStatistik(db: SQLiteDatabase): Promise<Statistik> {
  const ringkas = await db.getFirstAsync<{
    jumlah_tempat: number;
    jumlah_kota: number;
    rata_rating: number | null;
  }>(
    `SELECT COUNT(*) AS jumlah_tempat,
            COUNT(DISTINCT CASE WHEN kota != '' THEN kota END) AS jumlah_kota,
            ROUND(AVG(CASE WHEN rating > 0 THEN rating END), 1) AS rata_rating
     FROM entri`
  );

  const perKategori = await db.getAllAsync<{ kategori: string; jumlah: number }>(
    `SELECT kategori, COUNT(*) AS jumlah
     FROM entri
     GROUP BY kategori
     ORDER BY jumlah DESC, kategori ASC`
  );

  const kotaTerbanyak = await db.getAllAsync<{ kota: string; jumlah: number }>(
    `SELECT kota, COUNT(*) AS jumlah
     FROM entri
     WHERE kota != ''
     GROUP BY kota
     ORDER BY jumlah DESC, kota ASC
     LIMIT 3`
  );

  return {
    jumlahTempat: ringkas?.jumlah_tempat ?? 0,
    jumlahKota: ringkas?.jumlah_kota ?? 0,
    rataRating: ringkas?.rata_rating ?? null,
    perKategori,
    kotaTerbanyak,
  };
}