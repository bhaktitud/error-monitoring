// Base URL untuk API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Mendapatkan token autentikasi dari storage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('authToken') || 
         localStorage.getItem('token') || 
         sessionStorage.getItem('token') || 
         null;
}

/**
 * Fungsi utility untuk melakukan request ke API
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Ambil token dari storage
  const token = getAuthToken();
  
  // Gabungkan headers default dengan headers dari options
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Tentukan headers final
  let finalHeaders: HeadersInit;

  // Jika body adalah FormData, filter keluar Content-Type dari baseHeaders
  if (options.body instanceof FormData) {
    const filteredHeaders: Record<string, string> = {};
    for (const key in baseHeaders) {
      if (Object.prototype.hasOwnProperty.call(baseHeaders, key) && key.toLowerCase() !== 'content-type') {
        const value = baseHeaders[key as keyof typeof baseHeaders];
        // Pastikan value bukan undefined sebelum assign
        if (value !== undefined) {
          filteredHeaders[key] = value;
        }
      }
    }
    finalHeaders = filteredHeaders;
  } else {
    // Jika bukan FormData, gunakan baseHeaders seperti biasa
    finalHeaders = baseHeaders;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: finalHeaders, // Gunakan finalHeaders
    });

    if (!response.ok) {
      // Parse error response
      const errorData = await response.json().catch(() => ({
        error: 'Terjadi kesalahan server'
      }));
      throw new Error(errorData.error || 'Terjadi kesalahan pada server');
    }
    
    // Parse response sebagai JSON
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Konstruktor URL API
 */
export function buildApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
} 