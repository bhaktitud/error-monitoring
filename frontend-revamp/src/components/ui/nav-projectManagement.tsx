"use client"

import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"

export function NavProjectManagement({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const router = useRouter();
  return (
    <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>Project Management</SidebarGroupLabel>
        <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title} onClick={() => router.push(item.url)}>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                    <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
