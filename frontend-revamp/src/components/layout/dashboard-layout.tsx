import { FC, ReactNode, useState } from 'react';
import { SidebarNav } from '@/components/ui/sidebar-nav';
import { Header } from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import PageTransition from '@/components/ui/page-transition';

interface DashboardLayoutProps {
  children: ReactNode;
  projectId?: string;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children, projectId }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-1 h-screen overflow-hidden">
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block flex-shrink-0`}>
          <SidebarNav projectId={projectId} />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header projectId={projectId} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          
          <main className="flex-1 overflow-auto p-6">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          
          <Footer />
        </div>
      </div>
    </div>
  );
}; 