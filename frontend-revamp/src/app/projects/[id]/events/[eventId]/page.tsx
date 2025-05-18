'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventsAPI } from '@/lib/api';
import { FiArrowLeft, FiAlertCircle, FiInfo, FiClock, FiUser, FiTag, FiLayers, FiMonitor, FiCode } from 'react-icons/fi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import RootCauseBasicView from '../../../../../components/insights/RootCauseBasicView';
import ErrorPredictionView from '../../../../../components/insights/ErrorPredictionView';

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

export default function EventDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const eventId = params.eventId as string;
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        // Dalam implementasi sebenarnya, kita akan menggunakan endpoint API khusus untuk mendapatkan detail event
        // Untuk saat ini, kita ambil semua events dan filter berdasarkan ID
        const allEvents = await EventsAPI.getEvents(projectId);
        const eventData = allEvents.find(e => e.id === eventId);
        
        if (!eventData) {
          throw new Error('Event tidak ditemukan');
        }
        
        setEvent(eventData);
        setError(null);
      } catch (err) {
        console.error('Error fetching event detail:', err);
        setError('Gagal memuat detail event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [projectId, eventId]);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMMM yyyy, HH:mm:ss', { locale: id });
  };

  // Extracting browser info from user agent
  const getBrowserInfo = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
    
    return 'Other';
  };

  // Extracting OS info from user agent
  const getOSInfo = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS X')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    
    return 'Other';
  };

  if (loading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Memuat detail event...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !event) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="flex flex-col items-center justify-center p-12">
          <FiAlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Event tidak ditemukan'}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/projects/${projectId}/events`)}
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Events
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/projects/${projectId}/events`)}
            className="mr-4"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Events
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center">
            <FiAlertCircle className="mr-2 h-5 w-5 text-destructive" />
            {event.errorType}
          </h1>
          <div className="flex flex-wrap gap-2 items-center mb-6">
            {event.statusCode && (
              <Badge variant={event.statusCode >= 500 ? "destructive" : "outline"} className="text-sm">
                Status Code: {event.statusCode}
              </Badge>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <FiClock className="mr-1 h-4 w-4" />
              {formatDate(event.timestamp)}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-auto grid-cols-4 md:inline-grid md:grid-cols-4">
            <TabsTrigger value="info">
              <FiInfo className="mr-2 h-4 w-4" />
              Info
            </TabsTrigger>
            <TabsTrigger value="stack">
              <FiLayers className="mr-2 h-4 w-4" />
              Stack Trace
            </TabsTrigger>
            <TabsTrigger value="browser">
              <FiMonitor className="mr-2 h-4 w-4" />
              Browser
            </TabsTrigger>
            <TabsTrigger value="user">
              <FiUser className="mr-2 h-4 w-4" />
              User Context
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FiInfo className="mr-2 h-4 w-4" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Error Type</h3>
                    <p className="font-medium">{event.errorType}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Message</h3>
                    <p>{event.message}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Timestamp</h3>
                    <p>{formatDate(event.timestamp)}</p>
                  </div>
                  {event.statusCode && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Status Code</h3>
                        <Badge variant={event.statusCode >= 500 ? "destructive" : "outline"}>
                          {event.statusCode}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stack" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FiCode className="mr-2 h-4 w-4" />
                  Stack Trace
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.stacktrace ? (
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono whitespace-pre-wrap">
                    {event.stacktrace}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">Tidak ada stack trace</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="browser" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FiMonitor className="mr-2 h-4 w-4" />
                  Informasi Browser
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.userAgent ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Browser</h3>
                      <p>{getBrowserInfo(event.userAgent)}</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Operating System</h3>
                      <p>{getOSInfo(event.userAgent)}</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">User Agent (Raw)</h3>
                      <p className="text-xs font-mono whitespace-pre-wrap break-all">{event.userAgent}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Tidak ada informasi browser</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="user" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FiUser className="mr-2 h-4 w-4" />
                  User Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.userContext && Object.keys(event.userContext).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(event.userContext).map(([key, value]) => (
                      <div key={key}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">{key}</h3>
                        <p className="break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                        {key !== Object.keys(event.userContext).pop() && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Tidak ada informasi user context</p>
                )}
              </CardContent>
            </Card>
            
            {event.tags && Object.keys(event.tags).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FiTag className="mr-2 h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(event.tags).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Analisis Akar Masalah */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RootCauseBasicView eventId={event.id} />
          <ErrorPredictionView eventId={event.id} />
        </div>
      </div>
    </DashboardLayout>
  );
} 