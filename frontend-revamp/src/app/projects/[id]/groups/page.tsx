'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { GroupsAPI } from '@/lib/api';
import { FiArrowLeft, FiFilter, FiChevronDown, FiSearch, FiAlertTriangle, FiCheckCircle, FiEyeOff } from 'react-icons/fi';
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
}

export default function ErrorGroupsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [groups, setGroups] = useState<ErrorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // all, open, resolved, ignored
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="w-4 h-4 text-muted-foreground" />
              </div>
              <input 
                type="text" 
                className="py-2 pl-10 pr-4 block w-full border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                placeholder="Cari error..." 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => {}}
              className="flex items-center"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              {filter === 'all' ? 'Semua Status' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              <FiChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <div className="relative">
              <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-popover ring-1 ring-black ring-opacity-5 hidden">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button 
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
                    role="menuitem"
                    onClick={() => handleFilterChange('all')}
                  >
                    Semua Status
                  </button>
                  <button 
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
                    role="menuitem"
                    onClick={() => handleFilterChange('open')}
                  >
                    Open
                  </button>
                  <button 
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
                    role="menuitem"
                    onClick={() => handleFilterChange('resolved')}
                  >
                    Resolved
                  </button>
                  <button 
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
                    role="menuitem"
                    onClick={() => handleFilterChange('ignored')}
                  >
                    Ignored
                  </button>
                </div>
              </div>
            </div>
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
                  <TableHead className="w-[80px]">Count</TableHead>
                  <TableHead className="w-[180px]">Last Seen</TableHead>
                  <TableHead className="w-[180px]">First Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroups.map((group) => (
                  <TableRow 
                    key={group.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/projects/${projectId}/groups/${group.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <span className="mr-2">{getStatusIcon(group.status)}</span>
                        {group.errorType}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">{group.message}</TableCell>
                    <TableCell>{getStatusBadge(group.status)}</TableCell>
                    <TableCell>{group.count}</TableCell>
                    <TableCell>{formatDate(group.lastSeen)}</TableCell>
                    <TableCell>{formatDate(group.firstSeen)}</TableCell>
                  </TableRow>
                ))}
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