'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorInsightAPI } from '@/lib/api';
import Link from 'next/link';
import { FiAlertTriangle, FiClock, FiExternalLink, FiActivity } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CoOccurringErrorsViewProps {
  groupId: string;
  projectId: string;
}

interface CoOccurringError {
  groupId: string;
  errorType: string;
  message: string;
  count: number;
  percentage: number;
}

export function CoOccurringErrorsView({ groupId, projectId }: CoOccurringErrorsViewProps) {
  const [coOccurringErrors, setCoOccurringErrors] = useState<CoOccurringError[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState(60); // default: 60 menit

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0', '#F4D03F'];

  useEffect(() => {
    async function fetchCoOccurringErrors() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await ErrorInsightAPI.findCoOccurringErrors(groupId, {
          timeWindow,
          limit: 8
        });
        
        setCoOccurringErrors(data.coOccurringErrors);
      } catch (err) {
        console.error('Error fetching co-occurring errors:', err);
        setError('Gagal memuat error yang terjadi bersamaan');
      } finally {
        setLoading(false);
      }
    }

    fetchCoOccurringErrors();
  }, [groupId, timeWindow]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <FiAlertTriangle />
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-destructive/20 rounded-md bg-destructive/10 text-center">
            <p>Terjadi kesalahan saat memuat data. Coba lagi nanti.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success but no co-occurring errors
  if (coOccurringErrors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FiActivity />
            Error Bersamaan
          </CardTitle>
          <CardDescription>
            Error yang sering terjadi bersamaan dalam rentang waktu {timeWindow} menit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-3">
            <Select
              value={timeWindow.toString()}
              onValueChange={(value) => setTimeWindow(parseInt(value, 10))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih rentang waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 menit</SelectItem>
                <SelectItem value="30">30 menit</SelectItem>
                <SelectItem value="60">60 menit</SelectItem>
                <SelectItem value="180">3 jam</SelectItem>
                <SelectItem value="360">6 jam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-center p-6 border border-dashed rounded-md">
            <p className="text-muted-foreground mb-2">Tidak ditemukan error yang terjadi bersamaan.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Badge variant="outline" className="cursor-pointer flex items-center gap-1" onClick={() => setTimeWindow(timeWindow * 2)}>
                <FiClock size={14} />
                <span>Perluas rentang waktu</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = coOccurringErrors.map((item) => ({
    name: item.errorType,
    value: item.count
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FiActivity />
            Error Bersamaan ({coOccurringErrors.length})
          </CardTitle>
          <Select
            value={timeWindow.toString()}
            onValueChange={(value) => setTimeWindow(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 menit</SelectItem>
              <SelectItem value="30">30 menit</SelectItem>
              <SelectItem value="60">1 jam</SelectItem>
              <SelectItem value="180">3 jam</SelectItem>
              <SelectItem value="360">6 jam</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          Error yang sering terjadi bersamaan dalam rentang waktu {timeWindow} menit
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Chart view */}
          <div className="h-[250px] border rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">Distribusi Error Bersamaan</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} kejadian`, 'Jumlah']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* List view */}
          <div>
            <h3 className="text-sm font-medium mb-2">Daftar Error Bersamaan</h3>
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-2">
                {coOccurringErrors.map((item) => (
                  <div 
                    key={item.groupId} 
                    className="border rounded-md p-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-xs flex items-center gap-1">
                          <Badge variant="secondary" className="font-normal text-xs">
                            {item.errorType}
                          </Badge>
                        </h4>
                        <p className="text-xs mt-1 line-clamp-1">{item.message}</p>
                      </div>
                      <Link 
                        href={`/projects/${projectId}/groups/${item.groupId}`}
                        target="_blank"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <FiExternalLink size={14} />
                      </Link>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                        <span>{item.count} kejadian</span>
                        <span>{item.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={item.percentage} 
                        className="h-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1">
          <FiClock size={12} />
          <span>Persentase menunjukkan seberapa sering error ini terjadi bersamaan dengan error utama.</span>
        </div>
      </CardFooter>
    </Card>
  );
} 