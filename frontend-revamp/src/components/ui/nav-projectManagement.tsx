"use client"

import { Settings2, Users } from "lucide-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function NavProjectManagement({
  projectId,
}: {
  projectId: string
}) {
  const pathname = usePathname();

  const navigation = [
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
  
  return (
    <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>Project Management</SidebarGroupLabel>
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    isActive={isActive}
                    className={isActive ? "border-l-2 border-sidebar-primary pl-[calc(0.5rem-1px)]" : ""}
                  >
                    {item.icon && <item.icon className={isActive ? "text-sidebar-primary" : ""} />}
                    <Link href={item.url} passHref>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
