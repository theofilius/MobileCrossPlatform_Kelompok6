import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type SOSContextType = {
  isHolding: boolean;
  holdCount: number;
  handlePressIn: () => void;
  handlePressOut: () => void;
};

const SOSContext = createContext<SOSContextType | null>(null);

export function SOSProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isHolding, setIsHolding] = useState(false);
  const [holdCount, setHoldCount] = useState(3);
  
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bersihkan memori saat aplikasi ditutup
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, []);

  const handlePressIn = useCallback(() => {
    setIsHolding(true);
    setHoldCount(3);

    // KOREKSI ARSITEKTUR: Gunakan prevCount agar tidak terjadi bug closure!
    holdTimerRef.current = setInterval(() => {
      setHoldCount((prevCount) => prevCount - 1);
    }, 1000);

    holdTimeoutRef.current = setTimeout(() => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      setIsHolding(false);
      setHoldCount(3);
      router.push('/emergency-active' as any);
    }, 3000);
  }, [router]);

  const handlePressOut = useCallback(() => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    setIsHolding(false);
    setHoldCount(3);
  }, []);

  return (
    <SOSContext.Provider value={{ isHolding, holdCount, handlePressIn, handlePressOut }}>
      {children}
    </SOSContext.Provider>
  );
}

export function useSOS() {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error('useSOS harus dipakai di dalam SOSProvider');
  return ctx;
}