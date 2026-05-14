// Report service — in-memory store, ready for Supabase swap

export type EmergencyType = 'fire' | 'accident' | 'crime' | 'disaster' | 'medical' | 'other';

export type Report = {
  id: string;
  userId?: string;
  type: EmergencyType;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  photoUri: string | null;
  audioUri: string | null;
  status: 'pending' | 'responded' | 'resolved';
  createdAt: Date;
};

export const EMERGENCY_LABELS: Record<EmergencyType, string> = {
  fire: 'Kebakaran',
  accident: 'Kecelakaan',
  crime: 'Kriminalitas',
  disaster: 'Bencana Alam',
  medical: 'Darurat Medis',
  other: 'Lainnya',
};

export const EMERGENCY_COLORS: Record<EmergencyType, string> = {
  fire: '#EF4444',
  accident: '#F97316',
  crime: '#8B5CF6',
  disaster: '#3B82F6',
  medical: '#10B981',
  other: '#6B7280',
};

// Seed community reports for demo UI
const SEED: Report[] = [
  {
    id: 'seed-1',
    userId: 'u1',
    type: 'fire',
    description: 'Kebakaran terjadi di ruko kawasan Menteng. Api sudah berhasil dipadamkan oleh tim Damkar. Warga sekitar diminta tetap waspada.',
    latitude: -6.1944,
    longitude: 106.8229,
    address: 'Jl. HOS Cokroaminoto, Menteng, Jakarta Pusat',
    photoUri: null,
    audioUri: null,
    status: 'resolved',
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'seed-2',
    userId: 'u2',
    type: 'accident',
    description: 'Kecelakaan beruntun melibatkan 3 kendaraan di Jl. Sudirman arah Semanggi. Kemacetan panjang hingga 2 km.',
    latitude: -6.2088,
    longitude: 106.8123,
    address: 'Jl. Jend. Sudirman, Senayan, Jakarta Selatan',
    photoUri: null,
    audioUri: null,
    status: 'responded',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'seed-3',
    userId: 'u3',
    type: 'medical',
    description: 'Lansia pingsan di halte TransJakarta Bundaran HI, sudah dibantu petugas dan dibawa ke RS terdekat.',
    latitude: -6.1953,
    longitude: 106.8226,
    address: 'Halte TransJakarta Bundaran HI, Jakarta Pusat',
    photoUri: null,
    audioUri: null,
    status: 'resolved',
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: 'seed-4',
    userId: 'u4',
    type: 'disaster',
    description: 'Banjir setinggi 40cm melanda permukiman di kawasan Pluit akibat hujan deras sejak tadi malam.',
    latitude: -6.1248,
    longitude: 106.7933,
    address: 'Jl. Pluit Raya, Penjaringan, Jakarta Utara',
    photoUri: null,
    audioUri: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 900000),
  },
];

// In-memory store (replace with Supabase calls)
const store: Report[] = [...SEED];

export function createReport(data: Omit<Report, 'id' | 'status' | 'createdAt'>): Report {
  // TODO: const { data: res, error } = await supabase.from('reports').insert({...data}).select().single();
  const report: Report = {
    ...data,
    id: Date.now().toString(),
    status: 'pending',
    createdAt: new Date(),
  };
  store.unshift(report);
  return report;
}

export function getReports(): Report[] {
  // TODO: const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  return [...store];
}

export function getReport(id: string): Report | undefined {
  // TODO: const { data } = await supabase.from('reports').select('*').eq('id', id).single();
  return store.find(r => r.id === id);
}