'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventAPI } from '@/lib/api/services/event';
import type { Event } from '@/lib/api/services/types';
import { FiArrowLeft, FiAlertCircle, FiInfo, FiClock } from 'react-icons/fi';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

// Interface untuk userContext dan tags yang sudah dihapus (diganti dengan import dari types.ts)

export default function EventsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await EventAPI.getEvents(projectId);
        setEvents(response.events);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Gagal memuat data event. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [projectId]);

  // Filter events berdasarkan pencarian
  const filteredEvents = events.filter(event => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.errorType.toLowerCase().includes(query) ||
      event.message.toLowerCase().includes(query) ||
      String(event.statusCode).includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset ke halaman pertama saat pencarian berubah
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm:ss', { locale: id });
  };

  const viewEventDetails = (event: Event) => {
    router.push(`/projects/${projectId}/events/${event.id}`);
  };

  // Extracting browser info from user agent
  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
    
    return 'Other';
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
            <h1 className="text-xl font-bold">Events</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">

            <Input 
                type="search" 
                placeholder="Cari event..." 
                value={searchQuery}
                onChange={handleSearch}
              />
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
            <p>Memuat event...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-lg border border-dashed border-border">
            <FiAlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Belum ada event</h3>
            <p className="text-muted-foreground mb-4">
              Event akan muncul di sini ketika aplikasi Anda mengirim error melalui SDK.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/projects/${projectId}/settings`)}
            >
              Lihat Panduan Integrasi
            </Button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-lg border border-border">
            <h3 className="font-medium text-lg mb-2">Tidak ada event yang cocok dengan pencarian</h3>
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')}
            >
              Reset Pencarian
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Error Type</TableHead>
                  <TableHead className="w-[250px]">Message</TableHead>
                  <TableHead className="w-[120px]">Status Code</TableHead>
                  <TableHead className="w-[150px]">Browser</TableHead>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.map((event) => (
                  <TableRow 
                    key={event.id}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {event.errorType}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{event.message}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{event.message}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {event.statusCode ? (
                        <Badge variant={event.statusCode >= 500 ? "destructive" : "outline"}>
                          {event.statusCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getBrowserInfo(event.userAgent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FiClock className="mr-1 h-3 w-3 text-muted-foreground" />
                        {formatDate(event.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewEventDetails(event)}
                        className="w-full"
                      >
                        <FiInfo className="mr-1 h-4 w-4" />
                        Detail
                      </Button>
                    </TableCell>
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