'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GroupsAPI, EventsAPI } from '@/lib/api';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';

interface SearchResult {
  id: string;
  type: 'group' | 'event';
  title: string;
  message: string;
  timestamp: string;
  status?: string;
}

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryParam) {
      handleSearch();
    }
  }, [queryParam]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Cari di error groups
      const groups = await GroupsAPI.getGroups(projectId);
      const filteredGroups = groups.filter(
        group => 
          group.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.errorType.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Cari di events
      const events = await EventsAPI.getEvents(projectId);
      const filteredEvents = events.filter(
        event => 
          event.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.errorType.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Gabungkan hasil
      const mappedGroups = filteredGroups.map(group => ({
        id: group.id,
        type: 'group' as const,
        title: group.errorType,
        message: group.message,
        timestamp: group.lastSeen,
        status: group.status
      }));
      
      const mappedEvents = filteredEvents.map(event => ({
        id: event.id,
        type: 'event' as const,
        title: event.errorType,
        message: event.message,
        timestamp: event.timestamp,
      }));
      
      setResults([...mappedGroups, ...mappedEvents]);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Terjadi kesalahan saat mencari. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}`);
    handleSearch();
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'group') {
      router.push(`/projects/${projectId}/groups/${result.id}`);
    } else {
      // Handle event click - navigasi ke detail event atau tampilkan modal
      router.push(`/projects/${projectId}/events?id=${result.id}`);
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
              Kembali
            </Button>
            <h1 className="text-2xl font-bold">Hasil Pencarian</h1>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-muted-foreground h-4 w-4" />
                </div>
                <Input
                  type="text"
                  placeholder="Cari error, message, atau stack trace..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Mencari...' : 'Cari'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">
              {results.length} hasil ditemukan untuk &quot;{queryParam}&quot;
            </h2>
          </div>

          {loading ? (
            <div className="text-center p-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Mencari...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-primary">{result.title}</h3>
                      <p className="text-foreground mt-1">{result.message}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString('id-ID')}
                      </span>
                      {result.status && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                          result.status === 'open' ? 'bg-destructive/20 text-destructive' :
                          result.status === 'resolved' ? 'bg-success/20 text-success-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground mt-1">
                        {result.type === 'group' ? 'Error Group' : 'Error Event'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : queryParam ? (
            <div className="text-center p-12 bg-muted rounded-lg border border-border">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-card mb-4">
                <FiSearch className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Tidak ada hasil</h3>
              <p className="text-muted-foreground">
                Tidak ada data yang cocok dengan kata kunci &quot;{queryParam}&quot;.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
} 