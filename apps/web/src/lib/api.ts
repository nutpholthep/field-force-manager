import axios, { AxiosError, type AxiosInstance } from 'axios';
import { env } from './env';
import { tokenStorage } from './token-storage';

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export const http: AxiosInstance = axios.create({
  baseURL: `${env.API_URL}/api`,
  withCredentials: false,
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>(`${env.API_URL}/api/auth/refresh`, { refresh_token: refresh });
    tokenStorage.set(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config;
    if (
      status === 401 &&
      original &&
      !(original as { _retry?: boolean })._retry &&
      !original.url?.includes('/auth/')
    ) {
      (original as { _retry?: boolean })._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) return reject(error);
            original.headers?.set?.('Authorization', `Bearer ${token}`);
            resolve(http.request(original));
          });
        });
      }
      isRefreshing = true;
      const token = await refreshAccessToken();
      isRefreshing = false;
      refreshQueue.forEach((cb) => cb(token));
      refreshQueue = [];
      if (token) {
        original.headers?.set?.('Authorization', `Bearer ${token}`);
        return http.request(original);
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
