import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Login | LogRaven',
  description: 'Masuk ke akun LogRaven Anda untuk memantau dan mengelola error pada aplikasi',
  openGraph: {
    title: 'Login | LogRaven',
    description: 'Masuk ke akun LogRaven Anda untuk memantau dan mengelola error pada aplikasi',
    type: 'website',
  }
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
} 