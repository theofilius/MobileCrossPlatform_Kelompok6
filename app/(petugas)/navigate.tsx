import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';

const NAVY = '#003B71';
const NAVY_DEEP = '#002952';
const RED = '#DC2626';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const SUB = '#94A3B8';
const BG = '#F8FAFD';
const CARD = '#FFFFFF';

export default function NavigateScreen() {
  const insets = useSafeAreaInsets();
  const { reportJson } = useLocalSearchParams<{ reportJson: string }>();
  const report = JSON.parse(reportJson || '{}');

  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      <StatusBar barStyle="light-content" backgroundColor={NAVY_DEEP} />

      <LinearGradient
        colors={[NAVY_DEEP, NAVY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menuju TKP</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.loadingText}>Mengambil lokasi kamu...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.loadingBox}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="location-outline" size={32} color={RED} />
          </View>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <MapView style={styles.map} region={getRegion()} showsUserLocation showsMyLocationButton>
          {myLocation && (
            <Marker coordinate={myLocation} title="Posisi Saya">
              <View style={[styles.pin, { backgroundColor: NAVY }]}>
                <MaterialCommunityIcons name="shield-account" size={16} color="#fff" />
              </View>
            </Marker>
          )}
          <Marker coordinate={victimCoords} title="Lokasi Korban">
            <View style={[styles.pin, { backgroundColor: RED }]}>
              <Ionicons name="alert" size={16} color="#fff" />
            </View>
          </Marker>
          {myLocation && (
            <Polyline coordinates={[myLocation, victimCoords]} strokeColor={NAVY} strokeWidth={3} lineDashPattern={[6, 3]} />
          )}
        </MapView>
      )}

      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="location" size={18} color={RED} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Lokasi Korban</Text>
            <Text style={styles.infoSub} numberOfLines={2}>{report?.location?.address || 'Lokasi tidak tersedia'}</Text>
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: NAVY }]}>
              <MaterialCommunityIcons name="shield-account" size={11} color="#fff" />
            </View>
            <Text style={styles.legendText}>Posisi Saya</Text>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: RED }]}>
              <Ionicons name="alert" size={11} color="#fff" />
            </View>
            <Text style={styles.legendText}>Lokasi Korban</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.mapsBtn} onPress={openGoogleMaps} activeOpacity={0.85}>
          <Ionicons name="navigate" size={17} color="#fff" />
          <Text style={styles.mapsBtnText}>Buka di Google Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1 },

  map: { flex: 1 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  loadingText: { fontSize: 13, color: MUTED },
  errorIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 13, color: RED, textAlign: 'center', lineHeight: 18 },

  pin: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2.5, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
    elevation: 4,
  },

  bottomPanel: {
    backgroundColor: CARD,
    padding: 16,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, minWidth: 0 },
  infoTitle: { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoSub: { fontSize: 13, color: TEXT, fontWeight: '600', marginTop: 2 },

  legendRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12, padding: 10,
    marginBottom: 12,
  },
  legendItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  legendDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  legendText: { fontSize: 11.5, color: TEXT, fontWeight: '600' },
  legendDivider: { width: 1, height: 22, backgroundColor: '#CBD5E1' },

  mapsBtn: {
    backgroundColor: NAVY, borderRadius: 24,
    paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  mapsBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
