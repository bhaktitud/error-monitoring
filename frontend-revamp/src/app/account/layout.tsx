'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Header } from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import PageTransition from '@/components/ui/page-transition';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProjectsAPI } from '@/lib/api';

// Note: Metadata harus di-export dari file terpisah karena ini adalah Client Component

interface AccountLayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Ambil project ID terakhir dari localStorage
    const lastProjectId = localStorage.getItem('lastProjectId');
    
    const fetchFirstProject = async () => {
      try {
        // Jika tidak ada projectId di localStorage, ambil project pertama dari API
        const { ownedProjects, invitedProjects } = await ProjectsAPI.getProjects();
        const allProjects = [...(ownedProjects || []), ...(invitedProjects || [])];
        
        if (allProjects.length > 0) {
          const firstProjectId = allProjects[0].id;
          // Simpan ke state dan localStorage
          setProjectId(firstProjectId);
          localStorage.setItem('lastProjectId', firstProjectId);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    
    if (lastProjectId) {
      setProjectId(lastProjectId);
    } else {
      fetchFirstProject();
    }
  }, []);

  return (
    <DashboardLayout projectId={projectId}>
      {children}
    </DashboardLayout>
  );
} 