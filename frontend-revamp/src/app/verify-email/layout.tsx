import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Verifikasi Email | LogRaven',
  description: 'Verifikasi alamat email Anda untuk mengaktifkan akun LogRaven',
  openGraph: {
    title: 'Verifikasi Email | LogRaven',
    description: 'Verifikasi alamat email Anda untuk mengaktifkan akun LogRaven',
    type: 'website',
  }
};

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return children;
} 