import { Directory, File, Paths } from 'expo-file-system';

export function ukuranFoto(): { jumlah: number; byte: number } {
  try {
    const dir = new Directory(Paths.document, 'foto');
    if (!dir.exists) return { jumlah: 0, byte: 0 };
    let byte = 0;
    let jumlah = 0;
    for (const x of dir.list()) {
      if (x instanceof File) {
        byte += x.size ?? 0;
        jumlah++;
      }
    }
    return { jumlah, byte };
  } catch {
    return { jumlah: 0, byte: 0 };
  }
}

export function hapusSemuaFoto() {
  try {
    const dir = new Directory(Paths.document, 'foto');
    if (dir.exists) dir.delete();
  } catch {}
}