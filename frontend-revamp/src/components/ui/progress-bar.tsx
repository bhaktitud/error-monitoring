import React from 'react';

interface ProgressBarProps {
  percent: number;
  total: number;
  quota: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percent, total, quota }) => {
  let barColor = 'bg-success';
  if (percent >= 80 && percent < 100) barColor = 'bg-warning';
  if (percent >= 100) barColor = 'bg-destructive';

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-foreground">Kuota Events Bulanan</span>
        <span className="text-xs text-muted-foreground">{total} / {quota}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        ></div>
      </div>
      <div className="text-xs mt-1 text-muted-foreground">{percent}% terpakai</div>
    </div>
  );
}; 