/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ErrorInsightAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

interface ErrorCorrelationChartProps {
  projectId: string;
  errorGroupId: string;
}

export function ErrorCorrelationChart({ projectId, errorGroupId }: ErrorCorrelationChartProps) {
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    async function fetchCorrelations() {
      try {
        setLoading(true);
        setError(null);
        const data = await ErrorInsightAPI.getErrorCorrelations(projectId, errorGroupId, timeWindow);
        setCorrelations(data.correlations || []);
      } catch (err) {
        console.error('Error fetching correlations:', err);
        setError('Gagal memuat data korelasi error');
      } finally {
        setLoading(false);
      }
    }

    fetchCorrelations();
  }, [projectId, errorGroupId, timeWindow]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Error Correlation</CardTitle>
          <Tabs 
            value={timeWindow} 
            onValueChange={(val) => setTimeWindow(val as '24h' | '7d' | '30d')}
            className="w-auto"
          >
            <TabsList className="grid w-[180px] grid-cols-3">
              <TabsTrigger value="24h">24J</TabsTrigger>
              <TabsTrigger value="7d">7H</TabsTrigger>
              <TabsTrigger value="30d">30H</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <p className="text-sm text-muted-foreground">
          Error yang sering terjadi sebelum error ini
        </p>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[200px] text-center text-muted-foreground">
            <div>
              <FiAlertTriangle className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
              <div>{error}</div>
            </div>
          </div>
        ) : correlations.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-center text-muted-foreground">
            <div>
              <p>Tidak ada data korelasi yang ditemukan</p>
              <p className="text-xs mt-1">
                Error ini tidak memiliki pola korelasi dengan error lain
              </p>
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={correlations.slice(0, 5)} layout="vertical">
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis 
                  dataKey="fromErrorType" 
                  type="category" 
                  width={150}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Persentase']}
                  labelFormatter={(value) => `Error Type: ${value}`}
                />
                <Bar 
                  dataKey="percentage" 
                  radius={[0, 4, 4, 0]}
                  fill="#8884d8"
                >
                  {correlations.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#8884d8' : '#4f46e5'}
                      opacity={1 - (index * 0.15)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium mb-2">Top Correlation</h4>
              {correlations.slice(0, 3).map((corr, idx) => (
                <div key={idx} className="border rounded-md p-3 bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                      {corr.percentage.toFixed(1)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">pengguna mengalami urutan ini</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium mt-2">
                    <span className="truncate max-w-[180px]" title={corr.fromErrorMessage}>
                      {corr.fromErrorMessage}
                    </span>
                    <FiArrowRight className="text-muted-foreground" />
                    <span className="truncate max-w-[180px]" title={corr.toErrorMessage}>
                      {corr.toErrorMessage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 