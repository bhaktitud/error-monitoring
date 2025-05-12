import { Cookies } from "next-client-cookies";

// Cookie options
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  path: '/',
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
} as const;

// Function untuk login
export const login = (token: string, cookies: Cookies) => {
  // Set token di localStorage untuk client-side check
  localStorage.setItem('authToken', token);
  localStorage.setItem('token', token); // Tambahkan juga dengan key 'token' untuk kompatibilitas
  
  // Set token di cookies untuk server-side check
  cookies.set('authToken', token, COOKIE_OPTIONS);
};

// Function untuk logout
export const logout = (cookies: Cookies) => {
  // Hapus token dari localStorage
  localStorage.removeItem('authToken');
  
  // Hapus token dari cookies
  cookies.remove('authToken');
};

// Function untuk cek status login
export const isLoggedIn = (): boolean => {
  // Pastikan ini dijalankan di browser
  if (typeof window === 'undefined') return false;
  
  // Cek token di localStorage
  const token = localStorage.getItem('authToken');
  return !!token;
};

// Function untuk mendapatkan session (token user)
export const getSession = async (): Promise<string | null> => {
  // Pastikan ini dijalankan di browser
  if (typeof window === 'undefined') return null;
  
  // Ambil token dari localStorage
  const token = localStorage.getItem('authToken');
  return token;
}; 