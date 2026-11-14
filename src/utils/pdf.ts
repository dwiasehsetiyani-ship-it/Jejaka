import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ambilFoto, type EntriRingkas } from '../db/entri';

export type OpsiPdf = { foto: boolean; cuaca: boolean; catatan: boolean; wiki: boolean };

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function fotoBase64(uri: string): Promise<string | null> {
  try {
    const b64 = await new File(uri).base64();
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return null;
  }
}

export async function buatHtml(
  db: SQLiteDatabase,
  daftar: EntriRingkas[],
  opsi: OpsiPdf,
  rentang: string
): Promise<string> {
  const bagian: string[] = [];

  for (const e of daftar) {
    const tgl = new Date(e.tanggal_kunjungan).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let gambar = '';
    if (opsi.foto) {
      const fotos = await ambilFoto(db, e.id);
      const data = (await Promise.all(fotos.map((f) => fotoBase64(f.path_berkas)))).filter(Boolean) as string[];
      if (data.length) gambar = `<div class="foto">${data.map((d) => `<img src="${d}" />`).join('')}</div>`;
    }

    const bintang = e.rating > 0 ? '★'.repeat(e.rating) + '☆'.repeat(5 - e.rating) : '';
    const cuaca =
      opsi.cuaca && e.suhu !== null ? `<div class="meta">Cuaca: ${e.suhu}°C, ${esc(e.kondisi_cuaca ?? '')}</div>` : '';
    const catatan =
      opsi.catatan && e.catatan
        ? `<p class="catatan">${esc(e.catatan).replace(/\n/g, '<br>')}</p>`
        : '';
    const wiki =
      opsi.wiki && e.wiki_judul && e.wiki_ringkasan
        ? `<p class="wiki">${esc(e.wiki_ringkasan)}<br><span>Sumber: Wikipedia, artikel "${esc(e.wiki_judul)}" (CC BY-SA)</span></p>`
        : '';

    bagian.push(`
      <div class="entri">
        <h2>${esc(e.nama_tempat)}</h2>
        <div class="meta">${esc([e.kota, tgl].filter(Boolean).join(' • '))}</div>
        <div class="meta"><b>${esc(e.kategori)}</b>${bintang ? ` &nbsp; <span class="bintang">${bintang}</span>` : ''}</div>
        ${cuaca}
        ${gambar}
        ${catatan}
        ${wiki}
      </div>`);
  }

  const atribusi = opsi.cuaca ? 'Cuaca: Open-Meteo.com (CC BY 4.0). ' : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: sans-serif; color: #2B1B12; padding: 24px; }
  h1 { color: #B5471B; margin: 0 0 4px; }
  .rentang { color: #8A7566; margin-bottom: 20px; }
  .entri { border-top: 1px solid #EADCCF; padding: 14px 0; page-break-inside: avoid; }
  h2 { margin: 0 0 4px; font-size: 18px; }
  .meta { color: #6b5a4d; font-size: 13px; margin: 2px 0; text-transform: none; }
  .meta b { color: #B5471B; text-transform: capitalize; }
  .bintang { color: #E0A100; }
  .foto { display: flex; gap: 6px; margin: 8px 0; }
  .foto img { width: 32%; height: 150px; object-fit: cover; border-radius: 6px; }
  .catatan { font-size: 14px; line-height: 1.5; }
  .wiki { font-size: 12px; color: #6b5a4d; background: #FBF6F1; padding: 8px; border-radius: 6px; }
  .wiki span { color: #8A7566; }
  .kaki { margin-top: 24px; font-size: 11px; color: #8A7566; border-top: 1px solid #EADCCF; padding-top: 8px; }
</style></head>
<body>
  <h1>Jurnal Perjalanan Jejaka</h1>
  <div class="rentang">${esc(rentang)} • ${daftar.length} tempat</div>
  ${bagian.join('')}
  <div class="kaki">${atribusi}Dibuat dengan Jejaka. Koordinat lokasi tidak disertakan.</div>
</body></html>`;
}