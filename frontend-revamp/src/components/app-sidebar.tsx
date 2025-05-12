'use client';

import React from 'react';
import { AuthAPI, UserProfile } from '@/lib/api';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Settings2, Users, LayoutDashboardIcon, AlertCircle, Clock, Webhook, Bell } from 'lucide-react';
import { ProjectSwitcher } from './ui/project-switcher';
import { NavErrorManagement } from './ui/nav-errorManagement';
import { NavUser } from './ui/nav-user';
import { NavDashboard } from './ui/nav-dashboard';
import { NavIntegration } from './ui/nav-integration';
import { NavProjectManagement } from './ui/nav-projectManagement';

interface AppSidebarProps {
  projectId?: string;
  variant?: "sidebar" | "floating" | "inset";
}

export function AppSidebar({ projectId, variant = "sidebar", ...props }: AppSidebarProps) {
  const [user, setUser] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AuthAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  const data = {
    user: {
      name: user?.name || "You",
      email: user?.email || "you@example.com",
      avatar: user?.avatar || "/avatars/shadcn.jpg",
    },
    navDashboard: [
      {
        title: "Dashboard",
        url: `/projects/${projectId}`,
        icon: LayoutDashboardIcon,
      },
    ],
    navErrorManagement: [
      {
        title: "Error Groups",
        url: `/projects/${projectId}/groups`,
        icon: AlertCircle,
      },
      {
        title: "Events",
        url: `/projects/${projectId}/events`,
        icon: Clock,
      },
    ],
    navIntegration: [

      {
        title: "Webhooks",
        url: `/projects/${projectId}/webhooks`,
        icon: Webhook,
      },
      {
        title: "Notifications",
        url: `/projects/${projectId}/notifications`,
        icon: Bell,
      }
    ],
    navProjectManagement: [
      {
        title: "Team Members",
        url: `/projects/${projectId}/members`,
        icon: Users,
      },
      {
        title: "Project Settings",
        url: `/projects/${projectId}/settings`,
        icon: Settings2,
      },
    ]
  }
  

  return (
    <Sidebar variant={variant} collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher currentProjectId={projectId} />
      </SidebarHeader>
      
      <SidebarContent className="py-2">
        <NavDashboard items={data.navDashboard} />
        <NavErrorManagement items={data.navErrorManagement} />
        <NavIntegration items={data.navIntegration} />
        <NavProjectManagement items={data.navProjectManagement} />
      </SidebarContent>

      <SidebarFooter className="mt-auto p-4 border-t">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
} 