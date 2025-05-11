import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Daftar | LogRaven',
  description: 'Buat akun LogRaven baru untuk mulai memantau dan mengelola error pada aplikasi Anda',
  openGraph: {
    title: 'Daftar | LogRaven',
    description: 'Buat akun LogRaven baru untuk mulai memantau dan mengelola error pada aplikasi Anda',
    type: 'website',
  }
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
} 