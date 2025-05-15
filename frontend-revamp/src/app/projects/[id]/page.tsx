'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorCard } from '@/components/ui/error-card';
import { FiAlertCircle, FiActivity, FiAlertTriangle, FiCheckCircle, FiClock, FiInfo, FiRefreshCw, FiPieChart, FiCpu, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { ProjectsAPI, StatsAPI, EventsAPI } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Brush } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  dsn: string;
  createdAt: string;
}

interface ProjectStats {
  totalEvents: number;
  totalGroups: number;
  openGroups: number;
  resolvedGroups: number;
  ignoredGroups: number;
  eventsByHour: Array<{ hour: string; count: number }>;
}

interface Event {
  id: string;
  errorType: string;
  message: string;
  timestamp: string;
  stacktrace: string;
  userAgent: string;
  statusCode: number;
}

// Definisikan komponen chart dengan data dari stats
const ChartArea = ({ data, onRefresh }: { data: ProjectStats | null, onRefresh: () => Promise<void> }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [zoom, setZoom] = useState(false);

  const handleLocalRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Jika tidak ada data, tampilkan pesan
  if (!data || !data.eventsByHour || data.eventsByHour.length === 0) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Belum ada data events untuk ditampilkan
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium flex items-center">
            <FiActivity className="mr-2 h-5 w-5" />
            Distribusi Events per Jam
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoom(!zoom)}
            >
              {zoom ? (
                <>
                  <FiZoomOut className="h-4 w-4" />
                </>
              ) : (
                <>
                  <FiZoomIn className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLocalRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <FiRefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FiRefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.eventsByHour}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="hour" 
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                stroke="var(--muted-foreground)" 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--card-foreground)'
                }}
                itemStyle={{ color: 'var(--card-foreground)' }}
                labelStyle={{ fontSize: 12, color: 'var(--card-foreground)' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                name="Jumlah Events"
                stroke="var(--primary)" 
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 4 }}
              />
              {zoom && (
                <Brush 
                  dataKey="hour"
                  height={30}
                  stroke="var(--primary)"
                  fill="var(--background)"
                  startIndex={0}
                  endIndex={data.eventsByHour.length - 1}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Komponen untuk menampilkan distribusi status error groups
const ErrorGroupsChart = ({ data, onRefresh }: { data: ProjectStats | null, onRefresh: () => Promise<void> }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [zoom, setZoom] = useState(false);

  const handleLocalRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Jika tidak ada data, tampilkan pesan
  if (!data) {
    return (
      <Card>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Belum ada data groups untuk ditampilkan
        </CardContent>
      </Card>
    );
  }

  // Siapkan data untuk bar chart
  const chartData = [
    { name: 'Unresolved', value: data.openGroups },
    { name: 'Resolved', value: data.resolvedGroups },
    { name: 'Ignored', value: data.ignoredGroups || 0 }
  ];

  return (
    <Card>
      <CardHeader className="px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium flex items-center">
            <FiPieChart className="mr-2 h-5 w-5" />
            Status Error Groups
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoom(!zoom)}
            >
              {zoom ? (
                <>
                  <FiZoomOut className="h-4 w-4" />
                </>
              ) : (
                <>
                  <FiZoomIn className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLocalRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <FiRefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FiRefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                stroke="var(--muted-foreground)" 
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--card-foreground)'
                }}
                itemStyle={{ color: 'var(--card-foreground)' }}
                labelStyle={{ fontSize: 12, color: 'var(--card-foreground)' }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name="Jumlah Groups"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
              {zoom && (
                <Brush 
                  dataKey="name"
                  height={30}
                  stroke="var(--primary)"
                  fill="var(--background)"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const DataTable = ({ events }: { events: Event[] }) => (
  <div className="rounded-xl overflow-hidden border">
    {events.length === 0 ? (
      <div className="p-6 flex items-center justify-center text-muted-foreground">
        Belum ada event yang tercatat
      </div>
    ) : (
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Error Type</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Message</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t hover:bg-muted/30">
              <td className="p-3 text-sm">{event.errorType}</td>
              <td className="p-3 text-sm truncate max-w-[300px]">{event.message}</td>
              <td className="p-3 text-sm text-muted-foreground">
                {format(new Date(event.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

// Komponen untuk menampilkan penggunaan kuota events
const UsageChart = ({ data, onRefresh }: { data: { totalEvents: number; quota: number; percent: number } | null, onRefresh: () => Promise<void> }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleLocalRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  if (!data) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Penggunaan Events</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLocalRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <FiRefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FiRefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          Belum ada data penggunaan
        </CardContent>
      </Card>
    );
  }

  // Menentukan status penggunaan
  const getStatusColor = (percent: number) => {
    if (percent > 90) return 'var(--destructive)';
    if (percent > 75) return 'var(--warning)';
    return 'var(--primary)';
  };

  const color = getStatusColor(data.percent);

  return (
    <Card>
      <CardHeader className="px-6 py-4">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium flex items-center">
            <FiCpu className="mr-2 h-5 w-5" />
            Penggunaan Kuota Events
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLocalRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <FiRefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FiRefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-2xl font-bold">{data.totalEvents}</div>
          <div className="text-muted-foreground">dari {data.quota.toLocaleString()} events</div>
          <Badge 
            variant="outline" 
            className="ml-auto" 
            style={{ color, borderColor: color }}
          >
            {data.percent}% terpakai
          </Badge>
        </div>
        <Progress 
          value={data.percent} 
          className="h-2"
          style={{ "--progress-color": color } as React.CSSProperties}
        />
      </CardContent>
    </Card>
  );
};

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventsUsage, setEventsUsage] = useState<{ totalEvents: number; quota: number; percent: number } | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Ambil data proyek
        const projectData = await ProjectsAPI.getProject(projectId);
        setProject(projectData);
        
        // Ambil statistik proyek
        try {
          const statsData = await StatsAPI.getProjectStats(projectId, 'week');
          setStats(statsData);
        } catch (statsErr) {
          console.error('Error fetching stats data:', statsErr);
          // Gunakan data default jika gagal
          setStats({
            totalEvents: 0,
            totalGroups: 0,
            openGroups: 0,
            resolvedGroups: 0,
            ignoredGroups: 0,
            eventsByHour: []
          });
        }
        
        // Ambil recent events
        try {
          const eventsData = await EventsAPI.getEvents(projectId);
          setEvents(eventsData.slice(0, 10)); // Hanya tampilkan 10 event terbaru
        } catch (eventsErr) {
          console.error('Error fetching events data:', eventsErr);
          setEvents([]);
        }
        
        // Ambil penggunaan events
        try {
          const usageData = await EventsAPI.getEventsUsage(projectId, 'week');
          setEventsUsage(usageData);
        } catch (usageErr) {
          console.error('Error fetching events usage:', usageErr);
          setEventsUsage({
            totalEvents: 0,
            quota: 10000,  // Nilai default
            percent: 0
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Gagal memuat data proyek. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [projectId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const usageData = await EventsAPI.getEventsUsage(projectId, 'week');
      setEventsUsage(usageData);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Gagal menyegarkan data. Silakan coba lagi nanti.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-muted-foreground">Memuat data proyek...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout projectId={projectId}>
        <ErrorCard
          title="Gagal memuat proyek"
          description={error}
          retryAction={() => window.location.reload()}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="flex justify-between items-center mb-6">
        
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">Dashboard - {project?.name}</h1>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6 rounded-md">
          <div className="flex">
            <FiAlertCircle className="h-5 w-5 text-destructive mr-3" />
            <span className="text-destructive">{error}</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <FiActivity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{eventsUsage?.totalEvents || stats?.totalEvents || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error Groups</CardTitle>
            <FiAlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalGroups || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <FiCheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats?.resolvedGroups || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <FiInfo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats?.openGroups || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid md:grid-cols-2">
          <TabsTrigger value="overview">
            <FiActivity className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="recent">
            <FiClock className="mr-2 h-4 w-4" />
            Recent Events
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <UsageChart data={eventsUsage} onRefresh={handleRefresh} />
          <div className="grid gap-4 md:grid-cols-2">
            <ChartArea data={stats} onRefresh={handleRefresh} />
            <ErrorGroupsChart data={stats} onRefresh={handleRefresh} />
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          <DataTable events={events} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
} 