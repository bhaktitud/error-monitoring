"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { FiSearch, FiAlertCircle, FiCheckCircle, FiXCircle } from "react-icons/fi"
import { useErrorsStore } from "@/lib/store/errors"
import { Input } from "@/components/ui/input"
import { SelectMenu, SelectMenuContent, SelectMenuItem, SelectMenuTrigger, SelectMenuValue } from "@/components/ui/select-menu"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge-component"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorMessage } from "@/components/ui/error-message"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function GroupsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { groups, isLoading, error, fetchGroups } = useErrorsStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")

  useEffect(() => {
    fetchGroups(projectId)
  }, [projectId, fetchGroups])

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || group.status === statusFilter
    const matchesLevel = levelFilter === "all" || group.level === levelFilter
    return matchesSearch && matchesStatus && matchesLevel
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <FiAlertCircle className="w-4 h-4 text-yellow-500" />
      case "resolved":
        return <FiCheckCircle className="w-4 h-4 text-green-500" />
      case "ignored":
        return <FiXCircle className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari error..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <SelectMenu value={statusFilter} onValueChange={setStatusFilter}>
              <SelectMenuTrigger className="w-[180px]">
                <SelectMenuValue placeholder="Filter Status" />
              </SelectMenuTrigger>
              <SelectMenuContent>
                <SelectMenuItem value="all">Semua Status</SelectMenuItem>
                <SelectMenuItem value="open">Open</SelectMenuItem>
                <SelectMenuItem value="resolved">Resolved</SelectMenuItem>
                <SelectMenuItem value="ignored">Ignored</SelectMenuItem>
              </SelectMenuContent>
            </SelectMenu>
            <SelectMenu value={levelFilter} onValueChange={setLevelFilter}>
              <SelectMenuTrigger className="w-[180px]">
                <SelectMenuValue placeholder="Filter Level" />
              </SelectMenuTrigger>
              <SelectMenuContent>
                <SelectMenuItem value="all">Semua Level</SelectMenuItem>
                <SelectMenuItem value="error">Error</SelectMenuItem>
                <SelectMenuItem value="warning">Warning</SelectMenuItem>
                <SelectMenuItem value="info">Info</SelectMenuItem>
              </SelectMenuContent>
            </SelectMenu>
          </div>
        </div>

        {error ? (
          <ErrorMessage message={error} />
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Tidak ada error yang ditemukan</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/projects/${projectId}/groups/${group.id}`)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(group.status)}
                        <h3 className="font-medium">{group.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{group.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={group.level === "error" ? "destructive" : group.level === "warning" ? "secondary" : "outline"}>
                        {group.level}
                      </Badge>
                      <Badge variant="outline">{group.count} events</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Terakhir terlihat {formatDistanceToNow(new Date(group.lastSeen), { addSuffix: true, locale: id })}</span>
                    <span>Pertama terlihat {formatDistanceToNow(new Date(group.firstSeen), { addSuffix: true, locale: id })}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 