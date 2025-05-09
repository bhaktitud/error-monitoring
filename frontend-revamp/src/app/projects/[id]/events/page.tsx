'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventsAPI } from '@/lib/api';
import { FiArrowLeft, FiAlertCircle, FiCalendar, FiInfo } from 'react-icons/fi';

// Interface untuk userContext dan tags
interface UserContext {
  userId?: string;
  [key: string]: unknown;
}

interface Tags {
  version?: string;
  [key: string]: unknown;
}

interface Event {
  id: string;
  errorType: string;
  message: string;
  timestamp: string;
  stacktrace: string;
  userAgent: string;
  statusCode: number;
  userContext: UserContext;
  tags: Tags;
}

export default function EventsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await EventsAPI.getEvents(projectId);
        setEvents(data);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const viewEventDetails = (eventId: string) => {
    // Dalam aplikasi sebenarnya, kita bisa membuat halaman detail event
    // atau menampilkan modal dengan detail lengkap
    alert(`Detail Event ID: ${eventId}`);
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mr-4"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
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
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-foreground">{event.errorType}</span>
                          {event.statusCode && (
                            <Badge className="ml-2" variant="outline">
                              {event.statusCode}
                            </Badge>
                          )}
                        </div>
                        <p className="text-foreground mb-1">{event.message}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <FiCalendar className="mr-1 h-3 w-3" />
                          <span>{formatDate(event.timestamp)}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewEventDetails(event.id)}
                      >
                        <FiInfo className="mr-1 h-4 w-4" />
                        Detail
                      </Button>
                    </div>
                    <div className="mt-2 text-xs font-mono bg-muted p-2 rounded border overflow-hidden text-muted-foreground">
                      {event.stacktrace?.split('\n')[0]}...
                    </div>
                    {(event.tags && Object.keys(event.tags).length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(event.tags).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 