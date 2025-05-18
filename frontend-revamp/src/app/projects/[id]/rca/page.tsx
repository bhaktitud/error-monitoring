'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FiDownload, 
  FiFilter, 
  FiBarChart2, 
  FiGrid, 
  FiActivity, 
  FiCalendar, 
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { ErrorInsightAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { RCAErrorDistributionChart } from '@/components/dashboard/RCAErrorDistributionChart';
import { RCATimelineView } from '@/components/dashboard/RCATimelineView';
import { RCAErrorBreakdownTable } from '@/components/dashboard/RCAErrorBreakdownTable';
import { FilterPopover } from '@/components/ui/filter-popover';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DownloadReportPopover } from '@/components/dashboard/DownloadReportPopover';

export default function RCADashboardPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [errorData, setErrorData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Seminggu terakhir
    to: new Date()
  });
  const [filter, setFilter] = useState({
    environment: 'all',
    status: 'all',
    browser: 'all',
  });

  useEffect(() => {
    async function fetchRCAData() {
      try {
        setLoading(true);
        // Ambil data statistik RCA
        const data = await ErrorInsightAPI.getRCAStats(projectId, {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          ...filter
        });
        
        setErrorData(data);
      } catch (error) {
        console.error('Error fetching RCA data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRCAData();
  }, [projectId, dateRange, filter]);

  const handleRefresh = () => {
    setLoading(true);
    // Re-fetch data
    ErrorInsightAPI.getRCAStats(projectId, {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      ...filter
    }).then(data => {
      setErrorData(data);
      setLoading(false);
    }).catch(error => {
      console.error('Error refreshing RCA data:', error);
      setLoading(false);
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Analisis Root Cause</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <DownloadReportPopover projectId={projectId} />
          
          <FilterPopover 
            filter={filter} 
            onFilterChange={setFilter} 
            options={{
              environment: ['all', 'production', 'staging', 'development'],
              status: ['all', 'resolved', 'unresolved', 'ignored'],
              browser: ['all', 'chrome', 'firefox', 'safari', 'edge']
            }}
          />
          
          <DateRangePicker
            dateRange={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Analisis</CardTitle>
            <CardDescription>Jumlah keseluruhan analisis RCA</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-3xl font-bold">{errorData?.totalAnalyses || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Masalah Terselesaikan</CardTitle>
            <CardDescription>Jumlah masalah yang telah terselesaikan</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{errorData?.resolvedIssues || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Waktu Penyelesaian Rata-rata</CardTitle>
            <CardDescription>Rata-rata waktu untuk menyelesaikan masalah</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <div className="text-3xl font-bold">{errorData?.avgResolutionTime || '0'} jam</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <FiGrid className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <FiActivity className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <FiBarChart2 className="mr-2 h-4 w-4" />
            Breakdown
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Error</CardTitle>
              <CardDescription>
                Distribusi error berdasarkan kategori akar masalahnya
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <RCAErrorDistributionChart data={errorData?.errorDistribution || []} />
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Root Causes</CardTitle>
                <CardDescription>
                  Penyebab error paling umum
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(errorData?.topRootCauses || []).map((cause: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{cause.name}</div>
                            <div className="text-sm text-muted-foreground">{cause.count} occurrences</div>
                          </div>
                        </div>
                        <div className="text-sm">{cause.percentage}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Impact by Environment</CardTitle>
                <CardDescription>
                  Dampak error pada berbagai lingkungan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(errorData?.impactByEnvironment || []).map((env: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{env.name}</span>
                          <span>{env.errorCount} errors</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${env.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Analisis</CardTitle>
              <CardDescription>
                Visualisasi waktu dan status analisis root cause
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <RCATimelineView data={errorData?.timeline || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="breakdown" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Breakdown Analisis Error</CardTitle>
              <CardDescription>
                Analisis detail error berdasarkan root cause
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <RCAErrorBreakdownTable data={errorData?.errorBreakdown || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 