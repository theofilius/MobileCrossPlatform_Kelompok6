import * as ImagePicker from 'expo-image-picker';

// Discriminated result so callers can show the right message instead of
// silently treating null/missing as "user just changed their mind".
// Reasons:
//   permission → OS-level permission was denied (or never granted)
//   cancelled  → user dismissed the picker without choosing anything
//   failed     → the picker threw or returned no asset
export type PickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'permission' | 'cancelled' | 'failed'; message?: string };

export type CameraHook = {
  capturePhoto: () => Promise<PickResult>;
  pickFromGallery: () => Promise<PickResult>;
};

// Modern expo-image-picker (SDK 54 / v17.x) accepts a MediaType[] array.
// The legacy string form ('images') and MediaTypeOptions.Images still work
// but emit a deprecation warning; using the array silences it.
const IMAGE_TYPES = ['images'] as const;

export function useCamera(): CameraHook {
  const capturePhoto = async (): Promise<PickResult> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return {
          ok: false,
          reason: 'permission',
          message: 'Izin kamera ditolak. Aktifkan di Pengaturan untuk memotret bukti laporan.',
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: IMAGE_TYPES as any,
        quality: 0.85,
        allowsEditing: false,
      });

      if (result.canceled) return { ok: false, reason: 'cancelled' };
      const uri = result.assets?.[0]?.uri;
      if (!uri) return { ok: false, reason: 'failed', message: 'Foto tidak terdeteksi.' };
      return { ok: true, uri };
    } catch (err: any) {
      return {
        ok: false,
        reason: 'failed',
        message: err?.message ?? 'Kamera gagal dibuka.',
      };
    }
  };

  const pickFromGallery = async (): Promise<PickResult> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return {
          ok: false,
          reason: 'permission',
          message: 'Izin galeri ditolak. Aktifkan akses Foto di Pengaturan.',
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: IMAGE_TYPES as any,
        quality: 0.85,
      });

      if (result.canceled) return { ok: false, reason: 'cancelled' };
      const uri = result.assets?.[0]?.uri;
      if (!uri) return { ok: false, reason: 'failed', message: 'Foto tidak terdeteksi.' };
      return { ok: true, uri };
    } catch (err: any) {
      return {
        ok: false,
        reason: 'failed',
        message: err?.message ?? 'Galeri gagal dibuka.',
      };
    }
  };

  return { capturePhoto, pickFromGallery };
}
