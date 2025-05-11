import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Reset Password | LogRaven',
  description: 'Reset password akun LogRaven Anda dengan mudah',
  openGraph: {
    title: 'Reset Password | LogRaven',
    description: 'Reset password akun LogRaven Anda dengan mudah',
    type: 'website',
  }
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
} 