import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
