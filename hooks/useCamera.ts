import * as ImagePicker from 'expo-image-picker';

export type CameraHook = {
  capturePhoto: () => Promise<string | null>;
  pickFromGallery: () => Promise<string | null>;
};

export function useCamera(): CameraHook {
  const capturePhoto = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets.length) return null;
    return result.assets[0].uri;
  };

  const pickFromGallery = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
    });

    if (result.canceled || !result.assets.length) return null;
    return result.assets[0].uri;
  };

  return { capturePhoto, pickFromGallery };
}