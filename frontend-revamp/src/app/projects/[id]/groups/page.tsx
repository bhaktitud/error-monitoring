'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ErrorCard } from '@/components/ui/error-card';
import { GroupsAPI } from '@/lib/api';
import { FiArrowLeft, FiFilter, FiChevronDown, FiSearch } from 'react-icons/fi';

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

  // Filter error groups berdasarkan status
  const filteredGroups = filter === 'all' 
    ? groups 
    : groups.filter(group => group.status === filter);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
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
              Kembali
            </Button>
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
              />
            </div>
            
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => {}}
                className="flex items-center"
              >
                <FiFilter className="mr-2 h-4 w-4" />
                Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
                <FiChevronDown className="ml-2 h-4 w-4" />
              </Button>
              <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-popover ring-1 ring-black ring-opacity-5 hidden">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button 
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
                    role="menuitem"
                    onClick={() => handleFilterChange('all')}
                  >
                    All
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
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <ErrorCard
                key={group.id}
                id={group.id}
                errorType={group.errorType}
                message={group.message}
                count={group.count}
                firstSeen={group.firstSeen}
                lastSeen={group.lastSeen}
                status={group.status as 'open' | 'resolved' | 'ignored'}
                assignedTo={group.assignedTo}
                statusCode={group.statusCode}
                onClick={() => router.push(`/projects/${projectId}/groups/${group.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 