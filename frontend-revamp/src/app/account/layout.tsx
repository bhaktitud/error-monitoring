'use client';

import { ReactNode } from 'react';
import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';

interface AccountLayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      
      <Footer />
    </div>
  );
} 