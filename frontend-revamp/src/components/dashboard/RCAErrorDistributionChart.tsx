'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Legend, Tooltip } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorDistributionItem {
  name: string;
  value: number;
  color: string;
}

interface RCAErrorDistributionChartProps {
  data: ErrorDistributionItem[];
}

// Warna untuk kategori error
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];

const renderActiveShape = (props: any) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value 
  } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#333" className="text-xl font-bold">
        {value}
      </text>
      <text x={cx} y={cy} dy={25} textAnchor="middle" fill="#888" className="text-sm">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 15}
        fill={fill}
      />
    </g>
  );
};

export function RCAErrorDistributionChart({ data }: RCAErrorDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Jika tidak ada data, tampilkan pesan
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Tidak ada data tersedia
      </div>
    );
  }

  // Siapkan data untuk chart
  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: item.color || COLORS[index % COLORS.length]
  }));

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={90}
          fill="#8884d8"
          dataKey="value"
          onMouseEnter={handlePieEnter}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value} error`, 'Jumlah']}
          labelFormatter={(name) => `Kategori: ${name}`}
        />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          iconSize={10}
        />
      </PieChart>
    </ResponsiveContainer>
  );
} 