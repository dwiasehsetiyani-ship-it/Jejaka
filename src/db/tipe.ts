export type Kategori = 'alam' | 'kuliner' | 'budaya' | 'religi' | 'belanja';

export const DAFTAR_KATEGORI: Kategori[] = ['alam', 'kuliner', 'budaya', 'religi', 'belanja'];

export type Entri = {
  id: string;
  nama_tempat: string;
  kota: string;
  kategori: Kategori;
  rating: number;
  catatan: string;
  latitude: number | null;
  longitude: number | null;
  tanggal_kunjungan: string;
  suhu: number | null;
  kondisi_cuaca: string | null;
  status_cuaca: 'terisi' | 'menunggu';
  wiki_judul: string | null;
  wiki_ringkasan: string | null;
  dibuat_pada: string;
  diubah_pada: string;
};

export type Foto = {
  id: string;
  entri_id: string;
  path_berkas: string;
  urutan: number;
};
