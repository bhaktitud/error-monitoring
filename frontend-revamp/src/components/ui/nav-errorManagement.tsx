"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavErrorManagement({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  return (
    <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>Error Management</SidebarGroupLabel>
        <SidebarMenu>
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <Link href={item.url} className="flex items-center">
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
