'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Brush,
  TooltipProps 
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface TimelineItem {
  date: string;
  resolved: number;
  unresolved: number;
  processing: number;
}

interface RCATimelineViewProps {
  data: TimelineItem[];
}

// Custom tooltip untuk timeline
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const dateLabel = format(new Date(label), 'dd MMMM yyyy', { locale: id });
    
    return (
      <div className="bg-background border rounded-md p-3 shadow-md">
        <p className="font-medium">{dateLabel}</p>
        <div className="space-y-1 mt-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.name}: <span className="font-medium">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export function RCATimelineView({ data }: RCATimelineViewProps) {
  // Jika tidak ada data, tampilkan pesan
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Tidak ada data timeline tersedia
      </div>
    );
  }

  // Format data untuk chart
  const chartData = data.map(item => ({
    date: item.date,
    resolved: item.resolved,
    unresolved: item.unresolved,
    processing: item.processing
  }));

  // Format ggal untuk XAxis
  const formatXAxis = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM', { locale: id });
  };

  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-end gap-2 mb-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs">Terselesaikan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs">Belum Terselesaikan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs">Sedang Diproses</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
            padding={{ left: 30, right: 30 }}
          />
          <YAxis allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="resolved"
            stroke="#10b981"
            activeDot={{ r: 8 }}
            name="Terselesaikan"
          />
          <Line
            type="monotone"
            dataKey="unresolved"
            stroke="#ef4444"
            name="Belum Terselesaikan"
          />
          <Line
            type="monotone"
            dataKey="processing"
            stroke="#3b82f6"
            name="Sedang Diproses"
          />
          <Brush dataKey="date" height={30} stroke="#8884d8" tickFormatter={formatXAxis} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 