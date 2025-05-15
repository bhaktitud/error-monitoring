"use client"

import { Bell } from "lucide-react"
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
import { useNotification } from "@/hooks/useNotification"
import { Badge } from "@/components/ui/badge"

export function NavNotification() {
  const pathname = usePathname();
  const { unreadCount } = useNotification();

  const navigation = [
    {
      title: "Notifikasi",
      url: "/notifications",
      icon: Bell,
    }
  ]
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>Notifikasi</SidebarGroupLabel>
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
                  <div className="relative">
                    {item.icon && <item.icon className={isActive ? "text-sidebar-primary" : ""} />}
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
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