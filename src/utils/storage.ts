const TOKEN_PREFIX = 'park_token_';

function base64Encode(str: string): string {
  try {
    return btoa(encodeURIComponent(str));
  } catch {
    return str;
  }
}

function base64Decode(str: string): string {
  try {
    return decodeURIComponent(atob(str));
  } catch {
    return str;
  }
}

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function encryptToken(token: string): string {
  return base64Encode(TOKEN_PREFIX + token);
}

export function decryptToken(encoded: string): string | null {
  const decoded = base64Decode(encoded);
  if (decoded.startsWith(TOKEN_PREFIX)) {
    return decoded.slice(TOKEN_PREFIX.length);
  }
  return null;
}

export function setToken(token: string): void {
  setStorage('auth_token', encryptToken(token));
}

export function getToken(): string | null {
  const encoded = getStorage<string | null>('auth_token', null);
  if (!encoded) return null;
  return decryptToken(encoded);
}

export function removeToken(): void {
  removeStorage('auth_token');
}
