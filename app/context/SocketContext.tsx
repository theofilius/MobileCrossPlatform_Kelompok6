import React, { createContext, useContext, useEffect, useState } from 'react';
import * as socketService from '../../services/socketService';

type SocketContextType = {
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
};

export const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  emit: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const offConnect = socketService.on('$connect', () => setIsConnected(true));
    const offDisconnect = socketService.on('$disconnect', () => setIsConnected(false));

    return () => {
      offConnect();
      offDisconnect();
      socketService.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, emit: socketService.emit }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);