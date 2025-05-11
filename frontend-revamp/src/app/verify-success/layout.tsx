import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Verifikasi Berhasil | LogRaven',
  description: 'Email Anda telah berhasil diverifikasi, silakan lanjutkan menggunakan LogRaven',
  openGraph: {
    title: 'Verifikasi Berhasil | LogRaven',
    description: 'Email Anda telah berhasil diverifikasi, silakan lanjutkan menggunakan LogRaven',
    type: 'website',
  }
};

export default function VerifySuccessLayout({ children }: { children: ReactNode }) {
  return children;
} 