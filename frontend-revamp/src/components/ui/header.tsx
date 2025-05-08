import { FC } from 'react';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiBell, FiSearch, FiHelpCircle } from 'react-icons/fi';

interface HeaderProps {
  projectId?: string;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: FC<HeaderProps> = ({ projectId, toggleSidebar, isSidebarOpen }) => {
  const pathname = usePathname();
  
  const isProjectPage = projectId !== undefined;
  
  // Fungsi untuk mendapatkan judul halaman berdasarkan pathname
  const getPageTitle = () => {
    if (!isProjectPage) return 'Projects';
    
    if (pathname.endsWith(`/projects/${projectId}`)) return 'Dashboard';
    if (pathname.includes(`/projects/${projectId}/groups`)) {
      if (pathname.split('/').length > 4) return 'Error Detail';
      return 'Error Groups';
    }
    if (pathname.includes(`/projects/${projectId}/events`)) return 'Events';
    if (pathname.includes(`/projects/${projectId}/stats`)) return 'Statistics';
    if (pathname.includes(`/projects/${projectId}/webhooks`)) return 'Webhooks';
    if (pathname.includes(`/projects/${projectId}/notifications`)) return 'Notifications';
    if (pathname.includes(`/projects/${projectId}/members`)) return 'Team Members';
    if (pathname.includes(`/projects/${projectId}/settings`)) return 'Settings';
    
    return 'Project';
  };

  const pageTitle = getPageTitle();

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="mr-4 p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
            >
              {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          )}
          
          <h1 className="text-lg font-medium text-gray-900">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Tombol pencarian */}
          <div className="relative hidden md:flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-60"
            />
          </div>
          
          {/* Tombol notifikasi */}
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 relative">
            <FiBell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Tombol bantuan */}
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <FiHelpCircle size={20} />
          </button>
          
          {/* Avatar user */}
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium"
            onClick={() => {}}
          >
            EM
          </button>
        </div>
      </div>
    </header>
  );
}; 