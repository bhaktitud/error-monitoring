import React, { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FiHome, FiAlertCircle, FiSettings, FiLink, FiUsers, 
  FiLogOut, FiPieChart, FiBell,
  FiClock, FiCode  
} from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';
import { logout } from '@/lib/auth';
import { useCookies } from 'next-client-cookies';
import { Button } from './button';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactElement;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarNavProps {
  projectId?: string;
}

export const SidebarNav: FC<SidebarNavProps> = ({ projectId }) => {
  const pathname = usePathname();
  const router = useRouter();
  const cookies = useCookies();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    logout(cookies);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // Definisi menu proyek dalam grup
  const getNavGroups = (): NavGroup[] => {
    if (!projectId) {
      return [
        {
          title: 'PROJECT',
          items: [
            {
              name: 'Projects',
              href: '/projects',
              icon: <FiHome className="mr-2 h-4 w-4" />,
            }
          ]
        }
      ];
    }

    return [
      {
        title: 'PROJECT',
        items: [
          {
            name: 'Dashboard',
            href: `/projects/${projectId}`,
            icon: <FiHome className="mr-2 h-4 w-4" />,
          }
        ]
      },
      {
        title: 'MONITORING',
        items: [
          {
            name: 'Error Groups',
            href: `/projects/${projectId}/groups`,
            icon: <FiAlertCircle className="mr-2 h-4 w-4" />,
          },
          {
            name: 'Events',
            href: `/projects/${projectId}/events`,
            icon: <FiClock className="mr-2 h-4 w-4" />,
          },
          {
            name: 'Statistics',
            href: `/projects/${projectId}/stats`,
            icon: <FiPieChart className="mr-2 h-4 w-4" />,
          }
        ]
      },
      {
        title: 'INTEGRATION',
        items: [
          {
            name: 'Webhooks',
            href: `/projects/${projectId}/webhooks`,
            icon: <FiLink className="mr-2 h-4 w-4" />,
          },
          {
            name: 'Notifications',
            href: `/projects/${projectId}/notifications`,
            icon: <FiBell className="mr-2 h-4 w-4" />,
          },
          {
            name: 'SDK Setup',
            href: `/projects/${projectId}/settings`,
            icon: <FiCode className="mr-2 h-4 w-4" />,
          }
        ]
      },
      {
        title: 'MANAGEMENT',
        items: [
          {
            name: 'Team Members',
            href: `/projects/${projectId}/members`,
            icon: <FiUsers className="mr-2 h-4 w-4" />,
          },
          {
            name: 'Settings',
            href: `/projects/${projectId}/settings`,
            icon: <FiSettings className="mr-2 h-4 w-4" />,
          }
        ]
      }
    ];
  };

  const navGroups = getNavGroups();

  return (
    <div className="w-64 bg-white h-full overflow-y-auto border-r flex flex-col">
      <div className="py-4 px-4 border-b">
        <Link href="/projects" className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded mr-2 flex items-center justify-center text-white font-bold">
            EM
          </div>
          <h1 className="text-lg font-bold text-gray-800">Error Monitor</h1>
        </Link>
      </div>

      <nav className="flex-grow p-2">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-3">
            <div
              className="px-3 py-2 text-xs font-semibold text-gray-400 tracking-wider"
            >
              {group.title}
            </div>
            
            <div className="space-y-0.5 mt-1">
              {group.items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                    isActive(item.href)
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="mt-auto p-4 border-t">
        {loading ? (
          <div className="flex items-center px-3 py-2 text-sm">
            <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
            <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        ) : user ? (
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium mr-2">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="p-1"
              onClick={handleLogout}
            >
              <FiLogOut className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center"
            onClick={() => router.push('/login')}
          >
            Login
          </Button>
        )}
      </div>
    </div>
  );
}; 