import React, { createContext, useContext, useState } from 'react';

export type Report = {
  id: string;
  type: string;
  status: string;
  description: string;
  location: { address: string };
  createdAt: string;
  userName: string;
  userPhone: string;
  coordinates: { lat: number; lng: number };
  photoUrl?: string;
};

const INITIAL_REPORTS: Report[] = [
  {
    id: '1',
    type: 'ambulance',
    status: 'pending',
    description: 'Tabrakan 2 motor di persimpangan, korban pingsan, butuh ambulans segera.',
    location: { address: 'Gading Serpong, Tangerang' },
    createdAt: '2 menit lalu',
    userName: 'Angelica Rose',
    userPhone: '+62 812-3456-7890',
    coordinates: { lat: -6.2382, lng: 106.6544 },
  },
  {
    id: '2',
    type: 'fire_department',
    status: 'accepted',
    description: 'Kebakaran di gedung ruko 3 lantai, api sudah menjalar ke lantai 2.',
    location: { address: 'BSD City, Serpong' },
    createdAt: '8 menit lalu',
    userName: 'Budi Santoso',
    userPhone: '+62 813-9876-5432',
    coordinates: { lat: -6.3012, lng: 106.6534 },
  },
  {
    id: '3',
    type: 'police',
    status: 'pending',
    description: 'Terjadi perampokan di minimarket, pelaku masih di sekitar lokasi.',
    location: { address: 'Alam Sutera, Tangerang' },
    createdAt: '15 menit lalu',
    userName: 'Citra Dewi',
    userPhone: '+62 857-1234-5678',
    coordinates: { lat: -6.2198, lng: 106.6512 },
  },
];

type ReportsContextType = {
  reports: Report[];
  acceptReport: (id: string) => void;
  updateStatus: (id: string, status: string) => void;
  removeReport: (id: string) => void;
};

const ReportsContext = createContext<ReportsContextType | null>(null);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);

  const acceptReport = (id: string) =>
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r));

  const updateStatus = (id: string, status: string) =>
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));

  const removeReport = (id: string) =>
    setReports(prev => prev.filter(r => r.id !== id));

  return (
    <ReportsContext.Provider value={{ reports, acceptReport, updateStatus, removeReport }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
