import crypto from 'crypto';
import { add } from 'date-fns';

// Membuat token acak untuk verifikasi email atau reset password
export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Membuat waktu kedaluwarsa untuk token verifikasi email (24 jam)
export const getVerificationTokenExpiry = (): Date => {
  return add(new Date(), { hours: 24 });
};

// Membuat waktu kedaluwarsa untuk token undangan project (24 jam)
export const getInviteTokenExpiry = (): Date => {
  return add(new Date(), { hours: 24 });
};

// Membuat waktu kedaluwarsa untuk token reset password (1 jam)
export const getResetTokenExpiry = (): Date => {
  return add(new Date(), { hours: 1 });
};

// Cek apakah token masih valid (belum kedaluwarsa)
export const isTokenValid = (expiry: Date | null | undefined): boolean => {
  if (!expiry) return false;
  return new Date() < new Date(expiry);
}; 