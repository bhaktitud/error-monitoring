'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ErrorInsightAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { FiAlertTriangle, FiUsers, FiClock } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';

interface UserImpactProps {
  projectId: string;
  errorGroupId?: string;
}

interface ImpactMetric {
  errorGroupId: string;
  errorType: string;
  message: string;
  impactLastHour: number;
  impactLastDay: number;
  impactLastWeek: number;
  totalUsersLastHour: number;
  totalUsersLastDay: number;
  totalUsersLastWeek: number;
}

export function UserImpactMetrics({ projectId, errorGroupId }: UserImpactProps) {
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<'1h' | '24h' | '7d'>('1h');

  useEffect(() => {
    async function fetchImpactMetrics() {
      try {
        setLoading(true);
        setError(null);
        const data = await ErrorInsightAPI.getUserImpact(
          projectId, 
          errorGroupId, 
          timeWindow
        );
        setMetrics(data.metrics || []);
      } catch (err) {
        console.error('Error fetching user impact metrics:', err);
        setError('Gagal memuat data dampak pengguna');
      } finally {
        setLoading(false);
      }
    }

    fetchImpactMetrics();
  }, [projectId, errorGroupId, timeWindow]);

  const getImpactValue = (metric: ImpactMetric): number => {
    switch (timeWindow) {
      case '1h': return metric.impactLastHour;
      case '24h': return metric.impactLastDay;
      case '7d': return metric.impactLastWeek;
      default: return metric.impactLastHour;
    }
  };

  const getTotalUsers = (metric: ImpactMetric): number => {
    switch (timeWindow) {
      case '1h': return metric.totalUsersLastHour;
      case '24h': return metric.totalUsersLastDay;
      case '7d': return metric.totalUsersLastWeek;
      default: return metric.totalUsersLastHour;
    }
  };
  
  const getImpactSeverity = (impactPercentage: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (impactPercentage >= 50) return 'critical';
    if (impactPercentage >= 25) return 'high';
    if (impactPercentage >= 10) return 'medium';
    return 'low';
  };

  const getImpactColor = (severity: 'low' | 'medium' | 'high' | 'critical'): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            {errorGroupId ? 'Dampak Error pada Pengguna' : 'Error dengan Dampak Tertinggi'}
          </CardTitle>
          <Tabs 
            value={timeWindow} 
            onValueChange={(val) => setTimeWindow(val as '1h' | '24h' | '7d')}
            className="w-auto"
          >
            <TabsList className="grid w-[180px] grid-cols-3">
              <TabsTrigger value="1h">1J</TabsTrigger>
              <TabsTrigger value="24h">24J</TabsTrigger>
              <TabsTrigger value="7d">7H</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <p className="text-sm text-muted-foreground">
          {errorGroupId 
            ? 'Persentase pengguna yang mengalami error ini'
            : 'Errors yang berdampak pada sebagian besar pengguna'
          }
        </p>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[40px] w-full" />
            <Skeleton className="h-[40px] w-full" />
            <Skeleton className="h-[40px] w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[150px] text-center text-muted-foreground">
            <div>
              <FiAlertTriangle className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
              <div>{error}</div>
            </div>
          </div>
        ) : metrics.length === 0 ? (
          <div className="flex items-center justify-center h-[150px] text-center text-muted-foreground">
            <div>
              <p>Tidak ada data dampak pengguna</p>
              <p className="text-xs mt-1">
                Belum ada pengguna yang terpengaruh oleh error ini
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {metrics.slice(0, 5).map((metric, idx) => {
              const impactValue = getImpactValue(metric);
              const totalUsers = getTotalUsers(metric);
              const severity = getImpactSeverity(impactValue);
              const impactColorClass = getImpactColor(severity);
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate max-w-[200px]" title={metric.errorType}>
                        {metric.errorType}
                      </span>
                      <Badge variant="outline" className={impactColorClass}>
                        {impactValue.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FiUsers className="h-3 w-3" />
                      <span>
                        {Math.round(totalUsers * impactValue / 100)} dari {totalUsers} pengguna
                      </span>
                    </div>
                  </div>
                  <div className="w-full">
                    <Progress 
                      value={impactValue} 
                      className={`h-2 ${
                        severity === 'critical' ? 'bg-red-100' : 
                        severity === 'high' ? 'bg-orange-100' : 
                        severity === 'medium' ? 'bg-amber-100' : 
                        'bg-green-100'
                      }`}
                      indicatorClassName={`${
                        severity === 'critical' ? 'bg-red-500' : 
                        severity === 'high' ? 'bg-orange-500' : 
                        severity === 'medium' ? 'bg-amber-500' : 
                        'bg-green-500'
                      }`}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-full" title={metric.message}>
                    {metric.message}
                  </div>
                </div>
              );
            })}
            
            <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground pt-2 border-t">
              <FiClock className="h-3 w-3" />
              <span>
                Waktu pengukuran: {
                  timeWindow === '1h' ? '1 jam terakhir' :
                  timeWindow === '24h' ? '24 jam terakhir' :
                  '7 hari terakhir'
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 