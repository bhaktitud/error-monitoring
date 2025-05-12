import { FC, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FiSearch, FiHelpCircle, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { AuthAPI, UserProfile } from '@/lib/api';
import { useCookies } from 'next-client-cookies';
import { logout } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Separator } from './separator';
import { SidebarTrigger } from './sidebar';
import { NotificationBell } from '@/components/NotificationBell';

interface HeaderProps {
  projectId?: string;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: FC<HeaderProps> = ({ projectId }) => {
  const pathname = usePathname();
  const router = useRouter();
  const cookies = useCookies();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AuthAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Tutup profile menu jika klik di luar
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
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

    console.log(pathname);
    
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
    logout(cookies);
    router.push('/login');
  };
  
  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Link href="/">
          <h1 className="text-base font-medium">LogRaven - {`${pageTitle}`}</h1>
        </Link>
      </div>
      <div className="px-6 h-16 flex items-center justify-between">
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
          
          {/* Notification Bell */}
          <NotificationBell />
          
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
              className="flex items-center"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Avatar className="h-8 w-8">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name || user.email} />
                ) : null}
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary font-medium">
                  {loading ? '...' : getInitials(user?.email || '', user?.name)}
                </AvatarFallback>
              </Avatar>
            </button>
            
            {/* Dropdown profile menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-sidebar border border-sidebar-border rounded-md shadow-lg py-2 z-20">
                {user && (
                  <div className="px-4 py-3 border-b border-sidebar-border/50">
                    <div className="flex items-center mb-2">
                      <Avatar className="h-10 w-10 mr-3">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name || user.email} />
                        ) : null}
                        <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary font-medium">
                          {getInitials(user.email, user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-sidebar-foreground">{user.name || 'User'}</p>
                        <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
                      </div>
                    </div>
                    {user.jobTitle && (
                      <p className="text-xs text-sidebar-foreground/60 truncate">{user.jobTitle}</p>
                    )}
                  </div>
                )}
                
                <Link 
                  href="/account/profile" 
                  className="block px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => {
                    if (projectId) {
                      localStorage.setItem('lastProjectId', projectId);
                    }
                  }}
                >
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