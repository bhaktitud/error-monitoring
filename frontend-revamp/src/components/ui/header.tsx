import { FC, useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FiMenu, FiX, FiBell, FiSearch, FiHelpCircle, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import { AuthAPI, UserProfile } from '@/lib/api';
import { useCookies } from 'next-client-cookies';
import { logout } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme-switcher';

interface HeaderProps {
  projectId?: string;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: FC<HeaderProps> = ({ projectId, toggleSidebar, isSidebarOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const cookies = useCookies();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
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
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-60"
            />
          </form>
          
          {/* Tombol notifikasi */}
          <div className="relative" ref={notificationsRef}>
            <button 
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Dropdown notifikasi */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-20">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-semibold">Notifikasi</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="py-8 text-center text-gray-500">
                    <p>Tidak ada notifikasi baru</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Tombol bantuan */}
          <div className="relative" ref={helpMenuRef}>
            <button 
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setShowHelpMenu(!showHelpMenu)}
            >
              <FiHelpCircle size={20} />
            </button>
            
            {/* Dropdown bantuan */}
            {showHelpMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-20">
                <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Dokumentasi
                </a>
                <a href="https://support.example.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Bantuan & Dukungan
                </a>
                <a href="https://status.example.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
                <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                  {loading ? '...' : getInitials(user?.email || '', user?.name)}
                </AvatarFallback>
              </Avatar>
            </button>
            
            {/* Dropdown profile menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-20">
                {user && (
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center mb-2">
                      <Avatar className="h-10 w-10 mr-3">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name || user.email} />
                        ) : null}
                        <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                          {getInitials(user.email, user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    {user.jobTitle && (
                      <p className="text-xs text-gray-500 truncate">{user.jobTitle}</p>
                    )}
                  </div>
                )}
                
                <Link href="/account/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FiUser className="inline-block mr-2 h-4 w-4" />
                  Profil
                </Link>
                
                <Link href="/account/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <FiSettings className="inline-block mr-2 h-4 w-4" />
                  Pengaturan
                </Link>
                
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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