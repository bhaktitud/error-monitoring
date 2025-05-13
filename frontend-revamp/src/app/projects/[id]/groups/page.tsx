'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { GroupsAPI, ProjectsAPI } from '@/lib/api';
import { FiArrowLeft, FiFilter, FiChevronDown, FiAlertTriangle, FiCheckCircle, FiEyeOff, FiMoreVertical, FiUser } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ErrorGroup {
  id: string;
  errorType: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
  statusCode: number;
  assignedTo: string;
  updatedAt: string;
  code: string;
}

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
  }
}

export default function ErrorGroupsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [groups, setGroups] = useState<ErrorGroup[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // all, open, resolved, ignored
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const data = await GroupsAPI.getGroups(projectId);
        setGroups(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching error groups:', err);
        setError('Gagal memuat data grup error. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [projectId]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await ProjectsAPI.getProjectMembers(projectId);
        setMembers(data);
        
        // Cek role pengguna saat ini
        const token = localStorage.getItem('authToken') || '';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userId;
            const currentUser = data.find(member => member.user.id === userId);
            
            if (currentUser) {
              setUserRole(currentUser.role);
            }
          } catch (error) {
            console.error('Error parsing JWT token:', error);
          }
        }
      } catch (err) {
        console.error('Error fetching project members:', err);
      }
    };

    fetchMembers();
  }, [projectId]);

  // Filter error groups berdasarkan status dan search query
  const filteredGroups = groups
    .filter(group => filter === 'all' || group.status === filter)
    .filter(group => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        group.errorType.toLowerCase().includes(query) ||
        group.message.toLowerCase().includes(query)
      );
    });

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset ke halaman pertama saat filter berubah
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset ke halaman pertama saat pencarian berubah
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: id });
  };

  // Status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      case 'resolved':
        return <Badge variant="default">Resolved</Badge>;
      case 'ignored':
        return <Badge variant="secondary">Ignored</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <FiAlertTriangle className="text-destructive" />;
      case 'resolved':
        return <FiCheckCircle className="text-green-500" />;
      case 'ignored':
        return <FiEyeOff className="text-muted-foreground" />;
      default:
        return <FiAlertTriangle className="text-muted-foreground" />;
    }
  };

  // Handle status change
  const handleStatusChange = async (groupId: string, newStatus: 'open' | 'resolved' | 'ignored') => {
    try {
      setIsActionLoading(groupId);
      await GroupsAPI.changeGroupStatus(groupId, newStatus);
      
      // Update local state untuk menghindari refresh
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId ? { ...group, status: newStatus } : group
        )
      );
      
      toast.success(`Status berhasil diubah menjadi ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Gagal mengubah status error group');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Handle assignment
  const handleAssign = async (groupId: string, memberId: string | null) => {
    try {
      setIsActionLoading(groupId);
      await GroupsAPI.assignGroup(groupId, memberId);
      
      // Update local state untuk menghindari refresh
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId ? { ...group, assignedTo: memberId || '' } : group
        )
      );
      
      toast.success(memberId ? 'Error group berhasil ditugaskan' : 'Assignment dihapus');
    } catch (err) {
      console.error('Error assigning error group:', err);
      toast.error('Gagal menugaskan error group');
    } finally {
      setIsActionLoading(null);
    }
  };

  // Mendapatkan informasi member yang ditugaskan
  const getAssignedMember = (memberId: string | null) => {
    if (!memberId) return null;
    return members.find(member => member.id === memberId);
  };

  // Cek apakah user dapat mengedit (admin atau owner)
  const canEdit = userRole === 'admin' || userRole === 'owner';

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/projects/${projectId}`)}
              className="mr-4"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Error Groups</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Input 
                type="search" 
                placeholder="Cari error..." 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center"
                >
                  <FiFilter className="mr-2 h-4 w-4" />
                  {filter === 'all' ? 'Semua Status' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  <FiChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleFilterChange('all')}>
                  Semua Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('open')}>
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('resolved')}>
                  Resolved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('ignored')}>
                  Ignored
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Memuat grup error...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-lg border border-dashed border-border">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-muted mb-4">
              <FiFilter className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">Belum ada error group yang dilaporkan</h3>
            <p className="text-muted-foreground mb-4">
              Error groups akan muncul di sini ketika aplikasi Anda mengirim error melalui SDK.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/projects/${projectId}/settings`)}
            >
              Lihat Panduan Integrasi
            </Button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-lg border border-border">
            <h3 className="font-medium text-lg mb-2">Tidak ada error group yang cocok dengan filter</h3>
            <Button 
              variant="outline" 
              onClick={() => setFilter('all')}
            >
              Tampilkan Semua
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Error Type</TableHead>
                  <TableHead className="w-[250px]">Message</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead className="w-[80px]">Count</TableHead>
                  <TableHead className="w-[150px]">Last Seen</TableHead>
                  <TableHead className="w-[150px]">First Seen</TableHead>
                  <TableHead className="w-[120px]">Assigned To</TableHead>
                  {canEdit && <TableHead className="w-[50px]">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroups.map((group) => {
                  const assignedMember = getAssignedMember(group.assignedTo);
                  
                  return (
                    <TableRow 
                      key={group.id}
                      className={canEdit ? "" : "cursor-pointer"}
                      onClick={() => {
                        // Jika tidak ada canEdit, seluruh baris bisa diklik
                        if (!canEdit) {
                          router.push(`/projects/${projectId}/groups/${group.id}`);
                        }
                      }}
                    >
                      <TableCell 
                        className="font-medium"
                        onClick={() => canEdit && router.push(`/projects/${projectId}/groups/${group.id}`)}
                      >
                        <div className={`flex items-center ${canEdit ? "cursor-pointer" : ""}`}>
                          <span className="mr-2">{getStatusIcon(group.status)}</span>
                          {group.errorType}
                        </div>
                      </TableCell>
                      <TableCell 
                        className="max-w-[250px] truncate"
                        onClick={() => canEdit && router.push(`/projects/${projectId}/groups/${group.id}`)}
                      >
                        {group.message}
                      </TableCell>
                      <TableCell
                        onClick={() => canEdit && router.push(`/projects/${projectId}/groups/${group.id}`)}
                      >
                        {getStatusBadge(group.status)}
                      </TableCell>
                      <TableCell
                        onClick={() => canEdit && router.push(`/projects/${projectId}/groups/${group.id}`)}
                      >
                        <Badge variant="outline" className="font-mono text-xs">{group.code}</Badge>
                      </TableCell>
                      <TableCell
                        onClick={() => canEdit && router.push(`/projects/${projectId}/groups/${group.id}`)}
                      >
                        {group.count}
                      </TableCell>
                      <TableCell
                        onClick={() => canEdit && router.push(`/projects/${projectId}/groups/${group.id}`)}
                      >
                        {formatDate(group.lastSeen)}
                      </TableCell>
                      <TableCell
                        onClick={() => canEdit && router.push(`/projects/${projectId}/groups/${group.id}`)}
                      >
                        {formatDate(group.firstSeen)}
                      </TableCell>
                      <TableCell
                        onClick={() => canEdit && router.push(`/projects/${projectId}/groups/${group.id}`)}
                      >
                        {assignedMember ? (
                          <div className="flex items-center">
                            <FiUser className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-xs truncate" title={assignedMember.user.email}>
                              {assignedMember.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Tidak ada</span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="action-menu">
                          {isActionLoading === group.id ? (
                            <div className="flex justify-center">
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <FiMoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(group.id, 'open')}
                                  disabled={group.status === 'open'}
                                >
                                  <FiAlertTriangle className="mr-2 h-4 w-4" />
                                  Status: Open
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(group.id, 'resolved')}
                                  disabled={group.status === 'resolved'}
                                >
                                  <FiCheckCircle className="mr-2 h-4 w-4" />
                                  Status: Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(group.id, 'ignored')}
                                  disabled={group.status === 'ignored'}
                                >
                                  <FiEyeOff className="mr-2 h-4 w-4" />
                                  Status: Ignored
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <FiUser className="mr-2 h-4 w-4" />
                                    Tugaskan Kepada
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleAssign(group.id, null)}>
                                      -- Tidak Ada --
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {members.map((member) => (
                                      <DropdownMenuItem 
                                        key={member.id}
                                        onClick={() => handleAssign(group.id, member.id)}
                                      >
                                        {member.user.email}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 