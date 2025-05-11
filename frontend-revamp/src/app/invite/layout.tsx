import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Undangan Project | LogRaven',
  description: 'Terima undangan untuk bergabung ke project LogRaven',
  openGraph: {
    title: 'Undangan Project | LogRaven',
    description: 'Terima undangan untuk bergabung ke project LogRaven',
    type: 'website',
  }
};

export default function InviteLayout({ children }: { children: ReactNode }) {
  return children;
} 