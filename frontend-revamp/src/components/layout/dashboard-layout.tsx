'use client';

import { FC, ReactNode, useState, useEffect } from 'react';
import Footer from '@/components/ui/footer';
import PageTransition from '@/components/ui/page-transition';
import { AppSidebar } from '@/components/app-sidebar';
import { 
  SidebarInset, 
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Header } from '../ui/header';

interface DashboardLayoutProps {
  children: ReactNode;
  projectId?: string;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children, projectId }) => {
  // Gunakan state untuk menyimpan lastProjectId
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);

  // Akses localStorage di useEffect untuk memastikan hanya dijalankan di client-side
  useEffect(() => {
    // Cek apakah localStorage tersedia (client-side)
    if (typeof window !== 'undefined') {
      const storedProjectId = localStorage.getItem('lastProjectId');
      setLastProjectId(storedProjectId);
    }
  }, []);

  // Tentukan project ID yang digunakan (dari localStorage atau props)
  const activeProjectId = lastProjectId ? lastProjectId : projectId;

  return (
    <SidebarProvider>
      <AppSidebar projectId={activeProjectId} variant="inset" />
      
      <SidebarInset className="max-w-full">
        <Header />
        
        <main className="flex-1 overflow-auto px-2 py-3 md:px-5 lg:px-6">
          <div className="mx-auto w-full">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
        
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}; 