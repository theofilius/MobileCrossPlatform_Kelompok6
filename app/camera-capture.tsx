import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function CameraCaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#003B71" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={64} color="#003B71" />
        <Text style={styles.permTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.permSub}>Kami butuh akses kamera untuk mengambil foto bukti kejadian.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Izinkan Akses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permCancel} onPress={() => router.back()}>
          <Text style={styles.permCancelText}>Batal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (photo?.uri) setCapturedUri(photo.uri);
    } finally {
      setCapturing(false);
    }
  };

  const handleConfirm = () => {
    if (!capturedUri) return;
    router.back();
  };

  const handleRetake = () => {
    setCapturedUri(null);
  };

  // Preview after capture
  if (capturedUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="cover" />

        <SafeAreaView style={styles.previewOverlay} edges={['top', 'bottom']}>
          <View style={styles.previewTop}>
            <Text style={styles.previewLabel}>Pratinjau Foto</Text>
          </View>

          <View style={styles.previewBottom}>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retakeBtnText}>Foto Ulang</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={20} color="#003B71" />
              <Text style={styles.confirmBtnText}>Gunakan Foto</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
          {/* Top controls */}
          <View style={styles.cameraTop}>
            <TouchableOpacity style={styles.overlayBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Ambil Foto Bukti</Text>
            <TouchableOpacity
              style={styles.overlayBtn}
              onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder hint */}
          <View style={styles.viewfinderArea} pointerEvents="none">
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

          {/* Bottom controls */}
          <View style={styles.cameraBottom}>
            <View style={styles.captureRow}>
              <View style={{ width: 44 }} />
              <TouchableOpacity
                style={[styles.captureBtn, capturing && styles.captureBtnActive]}
                onPress={handleCapture}
                disabled={capturing}
              >
                {capturing
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <View style={styles.captureBtnInner} />
                }
              </TouchableOpacity>
              <View style={{ width: 44 }} />
            </View>
            <Text style={styles.cameraHint}>Pastikan objek terlihat jelas</Text>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  permissionScreen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#003B71',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  permSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  permBtn: {
    backgroundColor: '#003B71',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  permBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  permCancel: { paddingVertical: 12 },
  permCancelText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  cameraTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  viewfinderArea: {
    alignSelf: 'center',
    width: width * 0.75,
    height: width * 0.75,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#FFFFFF', borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: '#FFFFFF', borderTopRightRadius: 4,
  },
  cornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#FFFFFF', borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: '#FFFFFF', borderBottomRightRadius: 4,
  },

  cameraBottom: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnActive: { opacity: 0.6 },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  cameraHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  // Preview
  previewContainer: { flex: 1, backgroundColor: '#000' },
  previewImage: { width, height },
  previewOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-between',
  },
  previewTop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewBottom: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    height: 52,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retakeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 52,
    gap: 8,
  },
  confirmBtnText: { color: '#003B71', fontSize: 15, fontWeight: '800' },
});