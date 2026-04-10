import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  profilePic: string;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("hz_token"));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem("hz_token");
    if (!t) { setUser(null); setLoading(false); return; }
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      localStorage.removeItem("hz_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (usernameOrEmail: string, password: string) => {
    const res = await api.auth.login({ usernameOrEmail, password });
    localStorage.setItem("hz_token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (username: string, email: string, password: string, displayName?: string) => {
    const res = await api.auth.register({ username, email, password, displayName });
    localStorage.setItem("hz_token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("hz_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
