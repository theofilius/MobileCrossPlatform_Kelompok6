import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';

const C = {
  navy:  '#1565C0',
  blue:  '#2196F3',
  lb:    '#E3F2FD',
  gray:  '#9E9E9E',
  red:   '#F44336',
  green: '#2E7D32',
  bg:    '#F5F7FA',
  white: '#FFFFFF',
};

export default function NavigateScreen() {
  const insets = useSafeAreaInsets();
  const { reportJson } = useLocalSearchParams<{ reportJson: string }>();
  const report = JSON.parse(reportJson || '{}');

  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading]       = useState(true);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  const victimCoords = {
    latitude:  report?.coordinates?.lat || -6.2382,
    longitude: report?.coordinates?.lng || 106.6544,
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Izin lokasi ditolak. Aktifkan lokasi di pengaturan HP.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setMyLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLoading(false);
    })();
  }, []);

  const openGoogleMaps = () => {
    const { latitude, longitude } = victimCoords;
    const label = encodeURIComponent(report?.location?.address || 'Lokasi Korban');
    const url = Platform.select({
      ios:     `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.canOpenURL('comgooglemaps://').then(supported => {
      if (supported && url) Linking.openURL(url);
      else Linking.openURL(googleMapsUrl);
    }).catch(() => Linking.openURL(googleMapsUrl));
  };

  const getRegion = () => {
    const myLat = myLocation?.latitude  || victimCoords.latitude  - 0.01;
    const myLng = myLocation?.longitude || victimCoords.longitude - 0.01;
    const midLat  = (myLat + victimCoords.latitude)  / 2;
    const midLng  = (myLng + victimCoords.longitude) / 2;
    const deltaLat = Math.abs(myLat - victimCoords.latitude)  * 1.6 + 0.01;
    const deltaLng = Math.abs(myLng - victimCoords.longitude) * 1.6 + 0.01;
    return { latitude: midLat, longitude: midLng, latitudeDelta: deltaLat, longitudeDelta: deltaLng };
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menuju TKP</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={C.navy} />
          <Text style={styles.loadingText}>Mengambil lokasi kamu...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.loadingBox}>
          <Text style={styles.errorIcon}>📍</Text>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <MapView style={styles.map} region={getRegion()} showsUserLocation showsMyLocationButton>
          {myLocation && (
            <Marker coordinate={myLocation} title="Posisi Saya" pinColor={C.navy}>
              <View style={styles.pinPetugas}><Text style={styles.pinText}>🚒</Text></View>
            </Marker>
          )}
          <Marker coordinate={victimCoords} title="Lokasi Korban" pinColor={C.red}>
            <View style={styles.pinKorban}><Text style={styles.pinText}>📍</Text></View>
          </Marker>
          {myLocation && (
            <Polyline coordinates={[myLocation, victimCoords]} strokeColor={C.navy} strokeWidth={3} lineDashPattern={[6, 3]} />
          )}
        </MapView>
      )}

      <View style={styles.bottomPanel}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}><Text style={styles.infoIconText}>📍</Text></View>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Lokasi Korban</Text>
            <Text style={styles.infoSub}>{report?.location?.address || 'Lokasi tidak tersedia'}</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🚒</Text>
            <Text style={styles.legendText}>Posisi Saya</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>📍</Text>
            <Text style={styles.legendText}>Lokasi Korban</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.mapsBtn} onPress={openGoogleMaps} activeOpacity={0.8}>
          <Text style={styles.mapsBtnIcon}>🗺</Text>
          <Text style={styles.mapsBtnText}>Buka di Google Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  header:        { backgroundColor: '#0060aa', paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:       { padding: 6 },
  backIcon:      { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle:   { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  map:           { flex: 1 },
  loadingBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:   { fontSize: 13, color: C.gray },
  errorIcon:     { fontSize: 40 },
  errorText:     { fontSize: 13, color: C.red, textAlign: 'center', paddingHorizontal: 30 },
  pinPetugas:    { backgroundColor: C.navy, borderRadius: 20, padding: 6, borderWidth: 2, borderColor: '#fff' },
  pinKorban:     { backgroundColor: C.red,  borderRadius: 20, padding: 6, borderWidth: 2, borderColor: '#fff' },
  pinText:       { fontSize: 18 },
  bottomPanel:   { backgroundColor: C.white, padding: 16, borderTopWidth: 1, borderTopColor: '#e8e8e8' },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  infoIcon:      { width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
  infoIconText:  { fontSize: 20 },
  infoText:      { flex: 1 },
  infoTitle:     { fontSize: 12, fontWeight: '700', color: '#333' },
  infoSub:       { fontSize: 11, color: C.gray, marginTop: 1 },
  legendRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, padding: 10, marginBottom: 12 },
  legendItem:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  legendIcon:    { fontSize: 16 },
  legendText:    { fontSize: 11, color: '#333', fontWeight: '600' },
  legendDivider: { width: 1, height: 20, backgroundColor: '#e0e0e0' },
  mapsBtn:       { backgroundColor: '#0060aa', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mapsBtnIcon:   { fontSize: 20 },
  mapsBtnText:   { color: C.white, fontSize: 15, fontWeight: '700' },
});