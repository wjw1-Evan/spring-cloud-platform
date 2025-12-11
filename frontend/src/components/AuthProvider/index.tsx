import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { history } from '@umijs/max';
import { login as apiLogin, register as apiRegister, currentUser as apiCurrentUser } from '@/services/auth';
import { refreshWith } from '@/utils/tokenRefresh';

type TokenData = {
  accessToken?: string;
  refreshToken?: string;
};

type AuthContextType = {
  token?: string | null;
  refreshToken?: string | null;
  user?: any | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => void;
  fetchUser: () => Promise<any | undefined>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string | null | undefined) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      return null;
    }
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('refreshToken');
    } catch (e) {
      return null;
    }
  });
  const [user, setUser] = useState<any | null>(null);
  const refreshTimeout = useRef<number | null>(null);

  const scheduleRefresh = (accessToken?: string | null) => {
    // clear existing
    if (refreshTimeout.current) {
      window.clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
    const payload = parseJwt(accessToken ?? token);
    if (payload && payload.exp) {
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      // refresh 60 seconds before expiry
      const ms = Math.max(0, expiresAt - now - 60 * 1000);
      // If already expired or close to expiry, refresh immediately
      const to = ms <= 0 ? 0 : ms;
      // setTimeout returns number in browser
      refreshTimeout.current = window.setTimeout(() => {
        doRefresh().catch(() => {
          // on failure, logout
          logout();
        });
      }, to) as unknown as number;
    }
  };

  const doRefresh = async () => {
    if (!refreshToken) throw new Error('no refresh token');
    const data = await refreshWith(refreshToken);
    if (!data) {
      logout();
      throw new Error('refresh failed');
    }
    if (data?.accessToken) {
      setToken(data.accessToken);
      try {
        localStorage.setItem('token', data.accessToken);
      } catch (e) {}
    }
    if (data?.refreshToken) {
      setRefreshToken(data.refreshToken);
      try {
        localStorage.setItem('refreshToken', data.refreshToken);
      } catch (e) {}
    }
    scheduleRefresh(data.accessToken ?? undefined);
    return data;
  };

  const fetchUser = async () => {
    try {
      const res = await apiCurrentUser();
      if (res && (res.success === true || res.success === 'true')) {
        setUser(res.data);
        return res.data;
      }
    } catch (e) {
      // debug: log error when fetching current user
      // eslint-disable-next-line no-console
      console.debug('[AuthProvider] fetchUser failed', e);
    }
    return undefined;
  };

  const login = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    if (res && (res.success === true || res.success === 'true')) {
      const data = res.data as TokenData & { email?: string };
      if (data.accessToken) {
        setToken(data.accessToken);
        try {
          localStorage.setItem('token', data.accessToken);
        } catch (e) {}
      }
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
        try {
          localStorage.setItem('refreshToken', data.refreshToken);
        } catch (e) {}
      }
      scheduleRefresh(data.accessToken);
      // fetch and set user
      try {
        await fetchUser();
      } catch (e) {}
      return data;
    }
    throw new Error('login failed');
  };

  const register = async (email: string, password: string) => {
    const res = await apiRegister({ email, password });
    if (res && (res.success === true || res.success === 'true')) {
      const data = res.data as TokenData;
      if (data.accessToken) {
        setToken(data.accessToken);
        try {
          localStorage.setItem('token', data.accessToken);
        } catch (e) {}
      }
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
        try {
          localStorage.setItem('refreshToken', data.refreshToken);
        } catch (e) {}
      }
      scheduleRefresh(data.accessToken);
      try {
        await fetchUser();
      } catch (e) {}
      return data;
    }
    throw new Error('register failed');
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } catch (e) {}
    if (refreshTimeout.current) {
      window.clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
    // redirect to login page
    try {
      history.replace('/user/login');
    } catch (e) {
      try {
        window.location.href = '/user/login';
      } catch (er) {}
    }
  };

  useEffect(() => {
    // On mount, if token exists schedule refresh and try to fetch user
    if (token) {
      scheduleRefresh(token);
      // try to fetch user; if fails and refreshToken exists, try refresh
      fetchUser().catch(async () => {
        if (refreshToken) {
          try {
            await doRefresh();
            await fetchUser();
          } catch (e) {
            logout();
          }
        } else {
          logout();
        }
      });
    } else if (refreshToken) {
      // try to refresh immediately
      doRefresh().catch(() => {
        logout();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Authentication guard: if there's no valid token/refreshToken/user, redirect to login
  useEffect(() => {
    try {
      const publicPaths = ['/user/login', '/user/register', '/user/register-result', '/umi/plugin/openapi'];
      const loc = window.location.pathname || '/';
      const isPublic = publicPaths.some((p) => loc.startsWith(p));
      if (!isPublic) {
        // if no access token and no refresh token or user info cannot be fetched, redirect to login
        if (!token && !refreshToken) {
          history.replace('/user/login');
        }
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshToken, user]);

  const value: AuthContextType = {
    token,
    refreshToken,
    user,
    login,
    register,
    logout,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthProvider;
