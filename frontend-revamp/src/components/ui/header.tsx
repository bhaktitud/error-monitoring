import { FC, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FiMenu, FiX, FiBell, FiSearch, FiHelpCircle, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAuthStore } from '@/lib/store';
import { logout } from '@/lib/auth';
import { useCookies } from 'next-client-cookies';

interface HeaderProps {
  projectId?: string;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: FC<HeaderProps> = ({ projectId, toggleSidebar, isSidebarOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: authLogout } = useAuthStore();
  const cookies = useCookies();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Tutup profile menu jika klik di luar
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      
      // Tutup notifications jika klik di luar
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      
      // Tutup help menu jika klik di luar
      if (helpMenuRef.current && !helpMenuRef.current.contains(event.target as Node)) {
        setShowHelpMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Redirect ke halaman pencarian dengan query
    if (projectId) {
      router.push(`/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  const handleLogout = () => {
    // Panggil fungsi logout dari auth store
    authLogout();
    
    // Hapus cookies
    logout(cookies);
    
    // Redirect ke halaman login
    router.replace('/login');
  };
  
  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-sidebar border-b border-sidebar-border sticky top-0 z-10">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="mr-4 p-2 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            >
              {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          )}
          
          <h1 className="text-lg font-medium text-sidebar-foreground">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-sidebar-foreground/60 h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-1.5 text-sm bg-sidebar-accent/20 border border-sidebar-border rounded-md focus:outline-none focus:ring-1 focus:ring-sidebar-primary focus:border-sidebar-primary text-sidebar-foreground w-60"
            />
          </form>
          
          {/* Tombol notifikasi */}
          <div className="relative" ref={notificationsRef}>
            <button 
              className="p-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            
            {/* Dropdown notifikasi */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-sidebar border border-sidebar-border rounded-md shadow-lg py-2 z-20">
                <div className="px-4 py-2 border-b border-sidebar-border/50">
                  <h3 className="text-sm font-semibold text-sidebar-foreground">Notifikasi</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="py-8 text-center text-sidebar-foreground/60">
                    <p>Tidak ada notifikasi baru</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Tombol bantuan */}
          <div className="relative" ref={helpMenuRef}>
            <button 
              className="p-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setShowHelpMenu(!showHelpMenu)}
            >
              <FiHelpCircle size={20} />
            </button>
            
            {/* Dropdown bantuan */}
            {showHelpMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-sidebar border border-sidebar-border rounded-md shadow-lg py-2 z-20">
                <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
                  Dokumentasi
                </a>
                <a href="https://support.example.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
                  Bantuan & Dukungan
                </a>
                <a href="https://status.example.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
                  Status Sistem
                </a>
              </div>
            )}
          </div>
          
          {/* Theme Switcher */}
          <ThemeSwitcher />
          
          {/* Profile menu */}
          <div className="relative" ref={profileMenuRef}>
            <button 
              className="p-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name || user?.email} />
                <AvatarFallback>{getInitials(user?.email || '', user?.name)}</AvatarFallback>
              </Avatar>
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-sidebar border border-sidebar-border rounded-md shadow-lg py-2 z-20">
                <div className="px-4 py-2 border-b border-sidebar-border/50">
                  <p className="text-sm font-medium text-sidebar-foreground">{user?.name || user?.email}</p>
                  <p className="text-xs text-sidebar-foreground/60">{user?.email}</p>
                </div>
                
                <Link href="/account/profile" className="block px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
                  <FiUser className="inline-block mr-2 h-4 w-4" />
                  Profil
                </Link>
                
                <Link href="/account/settings" className="block px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
                  <FiSettings className="inline-block mr-2 h-4 w-4" />
                  Pengaturan
                </Link>
                
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-sidebar-accent"
                  onClick={handleLogout}
                >
                  <FiLogOut className="inline-block mr-2 h-4 w-4" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}; 