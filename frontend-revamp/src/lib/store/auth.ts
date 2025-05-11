// Tipe data untuk User
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

// Kunci localStorage
const AUTH_USER_KEY = 'auth_user';
const AUTH_TOKEN_KEY = 'authToken';

/**
 * Menyimpan data user ke localStorage
 */
export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

/**
 * Mendapatkan data user dari localStorage
 */
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
        return null;
      }
    }
  }
  return null;
}

/**
 * Membuat data user baru dan token
 */
export function createUser(user: User, token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(user);
  }
}

/**
 * Menghapus data user dan token (logout)
 */
export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/**
 * Mengecek apakah user sudah login
 */
export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return false;
}

/**
 * Mendapatkan token autentikasi
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
} 