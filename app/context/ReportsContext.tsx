import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  listReports,
  subscribeToReports,
  updateReportStatus,
  type Report as RemoteReport,
  type ReportStatus,
} from '../../services/reportService';
import { AuthContext } from './AuthContext';

/**
 * Shape consumed by the petugas dashboard / detail screens.
 * Mirrors the older dummy ReportsContext API so call sites don't change.
 *
 *   - id, type, status, description, createdAt (human string), userName,
 *     userPhone, location.address, coordinates, photoUrl
 *
 * Plus a few new fields exposed for the redesign: priority, raw createdAt, etc.
 */
export type DashboardReport = {
  id: string;
  type: string;
  status: string;
  description: string;
  location: { address: string };
  createdAt: string;     // "5 menit lalu" — derived
  createdAtRaw: Date;
  userName: string;
  userPhone: string;
  coordinates: { lat: number; lng: number };
  photoUrl?: string;
  audioUrl?: string;
  priority: string;
};

type ReportsContextType = {
  reports: DashboardReport[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  acceptReport: (id: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  removeReport: (id: string) => void; // local-only fallback; no DB delete
};

const ReportsContext = createContext<ReportsContextType | null>(null);

// Map our DB enum types to the icon keys the legacy petugas UI uses.
// (ambulance/police/fire_department were the old dummy keys; we keep them so
// the existing dashboard styling matches without a sweeping rewrite.)
const SERVICE_KEY: Record<string, 'ambulance' | 'police' | 'fire_department'> = {
  medical: 'ambulance',
  crime: 'police',
  fire: 'fire_department',
  accident: 'ambulance',
  disaster: 'fire_department',
  other: 'ambulance',
};

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const day = Math.floor(h / 24);
  return `${day} hari lalu`;
}

function toDashboard(r: RemoteReport): DashboardReport {
  return {
    id: r.id,
    type: SERVICE_KEY[r.type] ?? 'ambulance',
    status: r.status,
    description: r.description,
    location: { address: r.address || 'Lokasi belum tersedia' },
    createdAt: relativeTime(r.createdAt),
    createdAtRaw: r.createdAt,
    userName: r.reporterName ?? 'Pelapor',
    userPhone: r.reporterPhone ?? '-',
    coordinates: {
      lat: r.latitude ?? 0,
      lng: r.longitude ?? 0,
    },
    photoUrl: r.photoUri ?? undefined,
    audioUrl: r.audioUri ?? undefined,
    priority: r.priority,
  };
}

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnce = useCallback(async () => {
    try {
      const rows = await listReports();
      setReports(rows.map(toDashboard));
      setError(null);
    } catch (e: any) {
      // RLS will block readers without a session; that's expected before login.
      // Only surface real errors to the UI.
      const msg = e?.message ?? 'Gagal memuat laporan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnce();
    const unsub = subscribeToReports(() => {
      // On any change (insert / update / delete) just refetch — small list,
      // simpler than reconciling individual events.
      fetchOnce();
    });
    return unsub;
  }, [fetchOnce]);

  const acceptReport = useCallback(async (id: string) => {
    // Assign the report to the petugas/admin who accepts it so the profile
    // stats and "Riwayat Penanganan" can group by handler later.
    await updateReportStatus(id, 'accepted', { assignedTo: user?.id ?? null });
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status: 'accepted' } : r)));
  }, [user?.id]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    await updateReportStatus(id, status as ReportStatus);
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  }, []);

  const removeReport = useCallback((id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  const value = useMemo<ReportsContextType>(
    () => ({ reports, loading, error, refresh: fetchOnce, acceptReport, updateStatus, removeReport }),
    [reports, loading, error, fetchOnce, acceptReport, updateStatus, removeReport],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
