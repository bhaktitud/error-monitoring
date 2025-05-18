import React from 'react';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface BarChartItem {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  tooltipPrefix?: string;
  tooltipSuffix?: string;
  className?: string;
}

const CustomTooltip = ({ 
  active, 
  payload, 
  label,
  prefix = "",
  suffix = ""
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-2 border rounded-md shadow-sm">
        <p className="font-medium">{label}</p>
        <p className="text-primary">
          {prefix}{payload[0].value}{suffix}
        </p>
      </div>
    );
  }

  return null;
};

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title,
  tooltipPrefix,
  tooltipSuffix,
  className 
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground">Tidak ada data</div>;
  }

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <RechartsBarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            content={<CustomTooltip prefix={tooltipPrefix} suffix={tooltipSuffix} />} 
          />
          <Bar dataKey="value" fill="#8884d8" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}; 