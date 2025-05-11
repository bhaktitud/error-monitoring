import React, { FC } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FiHome, FiAlertCircle, FiSettings, FiLink, FiUsers, 
  FiLogOut, FiPieChart, FiBell,
  FiClock, FiCode  
} from 'react-icons/fi';
import { Button } from './button';
import { useAuthStore } from '@/lib/store';
import { logout } from '@/lib/auth';
import { useCookies } from 'next-client-cookies';

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
  const { user, logout: authLogout } = useAuthStore();
  const cookies = useCookies();

  const handleLogout = () => {
    authLogout();
    logout(cookies);
    router.replace('/login');
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
            href: `/projects/${projectId}/sdk-setup`,
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

  // Komponen reusable untuk item navigasi
  const NavItemLink: FC<{ item: NavItem; isActive: boolean }> = ({ item, isActive }) => (
  <Link
    href={item.href}
    className={cn(
      'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
      isActive
        ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
    )}
  >
    {item.icon}
    <span>{item.name}</span>
  </Link>
);

// Komponen reusable untuk grup navigasi
const NavGroup: FC<{ group: NavGroup; isActive: (path: string) => boolean }> = ({ group, isActive }) => (
  <div className="mb-3">
    <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 tracking-wider">
      {group.title}
    </div>
    <div className="space-y-0.5 mt-1">
      {group.items.map((item, index) => (
        <NavItemLink key={index} item={item} isActive={isActive(item.href)} />
      ))}
    </div>
  </div>
);

  return (
    <div className="w-64 bg-sidebar h-full overflow-y-auto border-r border-sidebar-border flex flex-col">
      <div className="py-4 px-4 border-b border-sidebar-border">
        <Link href="/projects" className="flex items-center">
          <div className="w-8 h-8 bg-sidebar-primary rounded mr-2 flex items-center justify-center text-sidebar-primary-foreground font-bold">
            LR
          </div>
          <h1 className="text-lg font-bold text-sidebar-foreground">LogRaven</h1>
        </Link>
      </div>

      <nav className="flex-grow p-2">
        {navGroups.map((group, groupIndex) => (
          <NavGroup key={groupIndex} group={group} isActive={isActive} />
        ))}
      </nav>

      {/* User Profile */}
      <div className="mt-auto p-4 border-t border-sidebar-border">
        {user ? (
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sidebar-primary/20 text-sidebar-primary font-medium mr-2">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{user.email}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="p-1 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={handleLogout}
            >
              <FiLogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center border-sidebar-border text-sidebar-foreground"
            onClick={() => router.push('/login')}
          >
            Login
          </Button>
        )}
      </div>
    </div>
  );
}; 