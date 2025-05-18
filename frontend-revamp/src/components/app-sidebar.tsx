'use client';

import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { ProjectSwitcher } from './ui/project-switcher';
import { NavErrorManagement } from './ui/nav-errorManagement';
import { NavUser } from './ui/nav-user';
import { NavDashboard } from './ui/nav-dashboard';
import { NavIntegration } from './ui/nav-integration';
import { NavProjectManagement } from './ui/nav-projectManagement';
import { NavRCAAnalytics } from './ui/nav-rcaAnalytics';

interface AppSidebarProps {
  projectId?: string;
  variant?: "sidebar" | "floating" | "inset";
}

export function AppSidebar({ projectId, variant = "sidebar", ...props }: AppSidebarProps) {

  return (
    <Sidebar variant={variant} collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher currentProjectId={projectId} />
      </SidebarHeader>
      
      <SidebarContent className="py-2">
        {
          projectId && (
            <>
              <NavDashboard projectId={projectId} />
              <NavErrorManagement projectId={projectId} />
              <NavRCAAnalytics projectId={projectId} />
              <NavIntegration projectId={projectId} />
              <NavProjectManagement projectId={projectId} />
            </>
          )
        }
      </SidebarContent>

      <SidebarFooter className="mt-auto p-4 border-t">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
} 