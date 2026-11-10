import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';
import { buatId } from './id';

const LEBAR_MAKS = 1280;
const UKURAN_MAKS = 500 * 1024; // 500 KB

// Perkecil lebar ke maks 1280 px, lalu turunkan kualitas sampai < 500 KB.
async function kompres(uri: string, lebar: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if (lebar > LEBAR_MAKS) ctx.resize({ width: LEBAR_MAKS });
  const gambar = await ctx.renderAsync();
  let hasil = uri;
  for (const kualitas of [0.8, 0.65, 0.5, 0.35, 0.2]) {
    const simpan = await gambar.saveAsync({ compress: kualitas, format: SaveFormat.JPEG });
    hasil = simpan.uri;
    if (new File(hasil).size <= UKURAN_MAKS) break;
  }
  return hasil;
}

function izinDitolak(nama: string) {
  Alert.alert(
    `Izin ${nama} ditolak`,
    `Jejaka butuh izin ${nama} untuk mengambil foto. Kamu bisa mengaktifkannya di pengaturan ponsel, atau pilih foto dari galeri. Entri juga tetap bisa disimpan tanpa foto.`,
    [{ text: 'Nanti' }, { text: 'Buka pengaturan', onPress: () => Linking.openSettings() }]
  );
}

export async function ambilDariKamera(): Promise<string | null> {
  const izin = await ImagePicker.requestCameraPermissionsAsync();
  if (!izin.granted) {
    izinDitolak('kamera');
    return null;
  }
  const hasil = await ImagePicker.launchCameraAsync({ quality: 1 });
  if (hasil.canceled) return null;
  const a = hasil.assets[0];
  return kompres(a.uri, a.width);
}

export async function pilihDariGaleri(batas: number): Promise<string[]> {
  const hasil = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: batas > 1,
    selectionLimit: batas,
    quality: 1,
  });
  if (hasil.canceled) return [];
  return Promise.all(hasil.assets.map((a) => kompres(a.uri, a.width)));
}

// Pindahkan foto hasil kompres ke penyimpanan permanen aplikasi.
export function salinKeDokumen(uri: string): string {
  const dir = new Directory(Paths.document, 'foto');
  if (!dir.exists) dir.create();
  const tujuan = new File(dir, `${buatId()}.jpg`);
  new File(uri).copy(tujuan);
  return tujuan.uri;
}

export function hapusBerkas(uri: string) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {}
}