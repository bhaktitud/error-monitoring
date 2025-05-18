'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';

// Interface untuk data dari backend
interface SystemCondition {
  name: string;
  value: string | number | boolean;
  count: number;
  percentage: number;
  errorCount: number;
}

interface SystemConditionGroup {
  name: string;
  conditions: SystemCondition[];
  totalEvents: number;
}

interface SystemContextData {
  browserData: SystemConditionGroup;
  osData: SystemConditionGroup;
  deviceData: SystemConditionGroup;
  methodData: SystemConditionGroup;
  statusCodeData: SystemConditionGroup;
  pathData: SystemConditionGroup;
  correlations: Array<{ 
    condition: string; 
    value: string; 
    errorRate: number; 
    confidence: number 
  }>;
  recommendations: Array<{ 
    factor: string; 
    explanation: string 
  }>;
}

// Props untuk komponen
interface SystemContextVisualizerProps {
  projectId: string;
  errorGroupId?: string;
  timeframe?: '24h' | '7d' | '30d';
}

// Warna untuk grafik
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', 
  '#FF6B6B', '#54C8FF', '#2DD4BF', '#FCD34D', '#FB7185'
];

export function SystemContextVisualizer({ 
  projectId, 
  errorGroupId,
  timeframe = '7d'
}: SystemContextVisualizerProps) {
  const [data, setData] = useState<SystemContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('device');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Convert timeframe to days for API
        const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
        
        // Construct URL with query parameters
        let url = `/api/projects/${projectId}/system-context?timeframe=${days}`;
        if (errorGroupId) {
          url += `&errorGroupId=${errorGroupId}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data konteks sistem');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching system context data:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, errorGroupId, timeframe]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tidak Ada Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Tidak ada data konteks sistem yang tersedia</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="device">Browser & Device</TabsTrigger>
          <TabsTrigger value="network">Network & Request</TabsTrigger>
          <TabsTrigger value="correlations">Pola & Korelasi</TabsTrigger>
        </TabsList>

        {/* Tab Browser & Device */}
        <TabsContent value="device" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Browser</CardTitle>
              <CardDescription>
                Perbandingan jumlah error berdasarkan browser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.browserData.conditions}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.browserData.conditions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} events`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                {data.browserData.conditions.map((browser, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="text-sm font-medium">{browser.name}</span>
                        {browser.errorCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {browser.errorCount} errors
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {browser.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={browser.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Operasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.osData.conditions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'count' ? `${value} events` : `${value} errors`, 
                          name === 'count' ? 'Total' : 'Errors'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#0088FE" name="Total" />
                      <Bar dataKey="errorCount" fill="#FF8042" name="Errors" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tipe Device</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.deviceData.conditions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'count' ? `${value} events` : `${value} errors`, 
                          name === 'count' ? 'Total' : 'Errors'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#00C49F" name="Total" />
                      <Bar dataKey="errorCount" fill="#FF6B6B" name="Errors" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Network & Request */}
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>HTTP Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.methodData.conditions}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.methodData.conditions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [`${value} events`, name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Status Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.statusCodeData.conditions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'count' ? `${value} events` : `${value} errors`, 
                          name === 'count' ? 'Total' : 'Errors'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#A28DFF" name="Total" />
                      <Bar dataKey="errorCount" fill="#FB7185" name="Errors" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Path dengan Error Terbanyak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.pathData.conditions.map((path, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <span className="text-sm font-medium truncate max-w-[400px]" title={path.name}>
                          {path.name}
                        </span>
                        {path.errorCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {path.errorCount} errors
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {path.count} requests
                      </span>
                    </div>
                    <Progress 
                      value={(path.errorCount / path.count) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pola & Korelasi */}
        <TabsContent value="correlations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Korelasi Error dengan Kondisi Sistem</CardTitle>
              <CardDescription>
                Faktor-faktor yang paling berkorelasi dengan terjadinya error
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.correlations} 
                    layout="vertical"
                    margin={{ left: 120 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis 
                      type="category" 
                      dataKey={(entry) => `${entry.condition}: ${entry.value}`} 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Error Rate']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="errorRate" 
                      name="Error Rate" 
                      fill="#FF6B6B"
                    />
                    <Bar 
                      dataKey="confidence" 
                      name="Confidence" 
                      fill="#0088FE"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Rekomendasi</CardTitle>
              <CardDescription>
                Rekomendasi berdasarkan analisis pola error
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {data.recommendations.map((recommendation, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <h4 className="font-medium">{recommendation.factor}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {recommendation.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Tidak ada rekomendasi yang tersedia. Coba perluas rentang waktu atau teliti data lebih banyak.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Komponen loading
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex space-x-4 overflow-auto pb-2">
        <Skeleton className="h-8 w-[120px] rounded-full" />
        <Skeleton className="h-8 w-[120px] rounded-full" />
        <Skeleton className="h-8 w-[120px] rounded-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[250px] w-full rounded-lg" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
} 