'use client';

import { ReactNode } from 'react';
import { Header } from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import PageTransition from '@/components/ui/page-transition';

interface AccountLayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-muted">
      <Header />
      
      <main className="flex-1 overflow-auto">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      
      <Footer />
    </div>
  );
} 