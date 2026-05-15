import React, { createContext, useState, ReactNode } from 'react';

export type User = {
  name: string;
  phone: string;
  email?: string;
  photoUri?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // In-memory session only (no AsyncStorage needed until backend is ready)
  const [user, setUser] = useState<User | null>(null);

  const login = async (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: false, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
