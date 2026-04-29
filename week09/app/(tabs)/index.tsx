import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRef, useState } from "react";
import { Alert, Button, Image, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required!</Text>
        <Button title="GRANT PERMISSION" onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();

      if (photo) {
        setImage(photo.uri);
      }
    }
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery permission is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveImage = async () => {
    if (!image) {
      Alert.alert("No image", "Please take or choose an image first.");
      return;
    }

    const permission = await MediaLibrary.requestPermissionsAsync(true);

    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery save permission is required!");
      return;
    }

    if (!FileSystem.documentDirectory) {
      Alert.alert("Error", "Document directory is not available.");
      return;
    }

    const fileName = image.split("/").pop() || "image.jpg";
    const newPath = FileSystem.documentDirectory + fileName;

    await FileSystem.copyAsync({
      from: image,
      to: newPath,
    });

    await MediaLibrary.saveToLibraryAsync(newPath);

    Alert.alert("Image saved", "Image has been saved to gallery.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Theofilius Martuado Arilo - 00000107586</Text>

      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <View style={styles.button}>
        <Button title="TAKE PICTURE" onPress={takePicture} />
      </View>

      <View style={styles.button}>
        <Button title="OPEN GALLERY" onPress={openGallery} />
      </View>

      <View style={styles.button}>
        <Button title="SAVE IMAGE" onPress={saveImage} />
      </View>

      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  text: {
    marginBottom: 10,
    color: "#000",
  },
  camera: {
    width: 300,
    height: 300,
    marginBottom: 10,
  },
  button: {
    marginVertical: 5,
    width: 150,
  },
  image: {
    width: 250,
    height: 200,
    marginTop: 20,
  },
});
