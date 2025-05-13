"use client"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavDashboard({
  projectId,
}: {
  projectId: string
}) {
  const pathname = usePathname();

  const navigation = [
    {
      title: "Dashboard",
      url: `/projects/${projectId}`,
      icon: LayoutDashboardIcon,
    },
  ]
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
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
