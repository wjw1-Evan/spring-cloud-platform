// Single-flight token refresh utility used by both AuthProvider and global interceptors
import { refresh as apiRefresh } from '@/services/auth';

type TokenData = {
  accessToken?: string;
  refreshToken?: string;
};

let isRefreshing = false;
let subscribers: Array<(token: string | null) => void> = [];

function notifySubscribers(token: string | null) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

export async function refreshWith(refreshToken: string): Promise<TokenData | null> {
  if (!refreshToken) return null;
  if (isRefreshing) {
    // join existing refresh
    return new Promise((resolve) => {
      subscribers.push((token) => {
        if (!token) return resolve(null);
        resolve({ accessToken: token });
      });
    });
  }

  isRefreshing = true;
  try {
    const res = await apiRefresh({ refreshToken });
    if (res && (res.success === true || res.success === 'true')) {
      const data = res.data as TokenData;
      notifySubscribers(data?.accessToken ?? null);
      return data;
    }
    notifySubscribers(null);
    return null;
  } catch (e) {
    notifySubscribers(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

export function subscribeRefresh(cb: (token: string | null) => void) {
  subscribers.push(cb);
}
