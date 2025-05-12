'use client';

import { FC, ReactNode } from 'react';
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

  const lastProjectId = localStorage.getItem('lastProjectId');

  return (
    <SidebarProvider>
      <AppSidebar projectId={lastProjectId ? lastProjectId : projectId} variant="inset" />
      
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