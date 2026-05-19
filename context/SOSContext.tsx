import { useRouter } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────
type SOSContextType = {
  isHolding: boolean;
  holdCount: number;
  handlePressIn: () => void;
  handlePressOut: () => void;
};

const SOSContext = createContext<SOSContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────
export function SOSProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isHolding, setIsHolding] = useState(false);
  const [holdCount, setHoldCount] = useState(3);

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // ✅ FIX 1: Gembok Anti-Double Push
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  const handlePressIn = useCallback(() => {
    if (isHolding) return;

    // Reset gembok setiap kali tombol mulai ditekan
    hasTriggeredRef.current = false; 
    setIsHolding(true);
    setHoldCount(3);

    let count = 3;
    holdTimerRef.current = setInterval(() => {
      count -= 1;
      setHoldCount(count);

      if (count <= 0) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        
        // ✅ FIX 2: Cek gembok. Jika belum pernah pindah layar, maka eksekusi
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true; // Kunci gemboknya!
          setIsHolding(false);
          setHoldCount(3);
          
          // ✅ FIX 3: Masukkan router.push ke event loop selanjutnya.
          // Ini mencegah error "Cannot update a component while rendering".
          setTimeout(() => {
            router.push('/emergency-active' as any);
          }, 0);
        }
      }
    }, 1000);

  }, [isHolding, router]);

  const handlePressOut = useCallback(() => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    
    // ✅ FIX 4: Jika SOS sudah terlanjur aktif (pindah layar), 
    // abaikan event PressOut ini agar tidak crash!
    if (hasTriggeredRef.current) return;

    setIsHolding(false);
    setHoldCount(3);
  }, []);

  const value = useMemo<SOSContextType>(() => ({
    isHolding,
    holdCount,
    handlePressIn,
    handlePressOut,
  }), [isHolding, holdCount, handlePressIn, handlePressOut]);

  return (
    <SOSContext.Provider value={value}>
      {children}
    </SOSContext.Provider>
  );
}

// ─── Custom Hook ──────────────────────────────────────────
export function useSOS() {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error('useSOS harus dipakai di dalam SOSProvider');
  return ctx;
}