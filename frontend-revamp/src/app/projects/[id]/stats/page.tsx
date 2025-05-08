'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsAPI } from '@/lib/api';
import { FiArrowLeft, FiPieChart, FiBarChart, FiCalendar } from 'react-icons/fi';

interface ProjectStats {
  totalEvents: number;
  totalGroups: number;
  openGroups: number;
  resolvedGroups: number;
  ignoredGroups: number;
  eventsByHour: Array<{ hour: string; count: number }>;
}

interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

export default function StatsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [browserDistribution, setBrowserDistribution] = useState<DistributionItem[]>([]);
  const [osDistribution, setOsDistribution] = useState<DistributionItem[]>([]);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mengambil statistik proyek
        const statsData = await StatsAPI.getProjectStats(projectId, timeframe);
        setStats(statsData);
        
        // Mengambil distribusi browser
        const browserData = await StatsAPI.getErrorDistribution(projectId, 'browser');
        setBrowserDistribution(browserData);
        
        // Mengambil distribusi OS
        const osData = await StatsAPI.getErrorDistribution(projectId, 'os');
        setOsDistribution(osData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Gagal memuat data statistik. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, timeframe]);

  const handleTimeframeChange = (newTimeframe: 'day' | 'week' | 'month') => {
    setTimeframe(newTimeframe);
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
          
          <div className="flex space-x-2">
            <Button 
              variant={timeframe === 'day' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleTimeframeChange('day')}
            >
              <FiCalendar className="mr-2 h-4 w-4" />
              Hari Ini
            </Button>
            <Button 
              variant={timeframe === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleTimeframeChange('week')}
            >
              <FiCalendar className="mr-2 h-4 w-4" />
              Minggu Ini
            </Button>
            <Button 
              variant={timeframe === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleTimeframeChange('month')}
            >
              <FiCalendar className="mr-2 h-4 w-4" />
              Bulan Ini
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Memuat statistik...</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Card Ringkasan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Error Groups</h3>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{stats.totalGroups}</div>
                    <Badge variant={stats.totalGroups > 0 ? 'destructive' : 'outline'}>
                      {stats.totalGroups > 0 ? 'Perhatian Diperlukan' : 'Tidak Ada Error'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Error Events</h3>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{stats.totalEvents}</div>
                    <FiBarChart className="h-6 w-6 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Status Error Groups</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-red-500">{stats.openGroups}</span>
                      <span className="text-xs text-gray-500">Open</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-green-500">{stats.resolvedGroups}</span>
                      <span className="text-xs text-gray-500">Resolved</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-gray-500">{stats.ignoredGroups}</span>
                      <span className="text-xs text-gray-500">Ignored</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Grafik Events per Jam (dalam bentuk sederhana) */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <FiBarChart className="mr-2 h-5 w-5" />
                  Events per Jam
                </h3>
                
                <div className="h-60 flex items-end space-x-1">
                  {stats.eventsByHour.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ 
                          height: `${item.count > 0 ? (item.count / Math.max(...stats.eventsByHour.map(i => i.count))) * 180 : 0}px` 
                        }}
                      ></div>
                      <div className="text-xs mt-2 text-gray-600">{item.hour}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Distribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <FiPieChart className="mr-2 h-5 w-5" />
                    Distribusi Browser
                  </h3>
                  
                  {browserDistribution.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada data
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {browserDistribution.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{item.count}</span>
                            <Badge variant="outline">{item.percentage}%</Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <FiPieChart className="mr-2 h-5 w-5" />
                    Distribusi Sistem Operasi
                  </h3>
                  
                  {osDistribution.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada data
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {osDistribution.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{item.count}</span>
                            <Badge variant="outline">{item.percentage}%</Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
              <FiBarChart className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="font-medium text-lg mb-2">Tidak ada data statistik</h3>
            <p className="text-gray-500 mb-4">
              Data statistik akan muncul setelah error dilaporkan oleh aplikasi Anda.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/projects/${projectId}/settings`)}
            >
              Lihat Panduan Integrasi
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 