import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  variant = 'default',
  showPercentage = false
}) => {
  const barColorVariants = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive'
  };

  const barColor = barColorVariants[variant];

  return (
    <div className="w-full">
      <div className="w-full bg-muted rounded-full h-3">
        <div
          className={cn("h-3 rounded-full transition-all duration-300", barColor)}
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
      {showPercentage && (
        <div className="text-xs mt-1 text-muted-foreground">{Math.round(value)}% terpakai</div>
      )}
    </div>
  );
}; 