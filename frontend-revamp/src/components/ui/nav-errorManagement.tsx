"use client"

import { AlertCircle, Clock } from "lucide-react"
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

export function NavErrorManagement({
  projectId,
}: {
  projectId: string
  }) {
  const pathname = usePathname();

  const navigation = [
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
  ]
  
  return (
    <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>Error Management</SidebarGroupLabel>
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
