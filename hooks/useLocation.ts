import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export type LocationState = {
  coords: { latitude: number; longitude: number } | null;
  address: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLocation(): LocationState {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('Memuat lokasi...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Akses lokasi ditolak');
        setError('Izin lokasi ditolak');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      if (place) {
        const parts = [place.street, place.district, place.city || place.subregion, place.region].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch {
      setError('Gagal memuat lokasi');
      setAddress('Lokasi tidak tersedia');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { coords, address, loading, error, refresh: fetchLocation };
}