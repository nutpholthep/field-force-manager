const ACCESS = 'ffm_access_token';
const REFRESH = 'ffm_refresh_token';

const isBrowser = () => typeof window !== 'undefined';

export const tokenStorage = {
  getAccess(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(ACCESS);
  },
  getRefresh(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(REFRESH);
  },
  set(access: string, refresh: string): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS, access);
    window.localStorage.setItem(REFRESH, refresh);
  },
  clear(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS);
    window.localStorage.removeItem(REFRESH);
  },
};
