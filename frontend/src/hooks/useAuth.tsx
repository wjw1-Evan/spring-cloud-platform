import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, login, register as registerApi, refresh } from '../services/auth';
import { UserInfo } from '../types';

interface AuthContextProps {
  token: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenValue, setTokenValue] = useState<string | null>(() => localStorage.getItem('token'));
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(() => localStorage.getItem('refreshToken'));
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (tokenValue) {
      fetchUser();
    }
  }, []);

  const doLogin = async (email: string, password: string) => {
    const resp = await login(email, password);
    setTokenValue(resp.accessToken);
    setRefreshTokenValue(resp.refreshToken);
    localStorage.setItem('token', resp.accessToken);
    localStorage.setItem('refreshToken', resp.refreshToken);
    await fetchUser();
  };

  const doRegister = async (email: string, password: string) => {
    const resp = await registerApi(email, password);
    setTokenValue(resp.accessToken);
    setRefreshTokenValue(resp.refreshToken);
    localStorage.setItem('token', resp.accessToken);
    localStorage.setItem('refreshToken', resp.refreshToken);
    await fetchUser();
  };

  const logout = () => {
    setTokenValue(null);
    setRefreshTokenValue(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const fetchUser = async () => {
    if (!tokenValue) return;
    try {
      const current = await getCurrentUser(tokenValue);
      setUser(current);
    } catch (err) {
      if (refreshTokenValue) {
        const refreshed = await refresh(refreshTokenValue);
        setTokenValue(refreshed.accessToken);
        localStorage.setItem('token', refreshed.accessToken);
        const current = await getCurrentUser(refreshed.accessToken);
        setUser(current);
      } else {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token: tokenValue,
        refreshToken: refreshTokenValue,
        user,
        login: doLogin,
        register: doRegister,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
