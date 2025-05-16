"use client";

import { Event } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Laptop, Monitor, Smartphone, AlertCircle, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  onClick?: (event: Event) => void;
  className?: string;
}

/**
 * Komponen EventCard untuk menampilkan event error
 */
export function EventCard({ event, onClick, className }: EventCardProps) {
  // Tentukan ikon berdasarkan device type
  const getDeviceIcon = () => {
    if (!event.deviceType) return null;
    
    if (event.deviceType.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (event.deviceType.toLowerCase().includes('tablet')) {
      return <Laptop className="h-4 w-4" />;
    } else {
      return <Monitor className="h-4 w-4" />;
    }
  };

  // Format tanggal relatif
  const formattedDate = event.timestamp ? 
    formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : 
    'Unknown date';

  // Tentukan badge color berdasarkan level error
  const getStatusColor = () => {
    if (event.errorType.toLowerCase().includes('fatal')) return 'destructive';
    if (event.errorType.toLowerCase().includes('error')) return 'destructive';
    if (event.errorType.toLowerCase().includes('warning')) return 'secondary';
    return 'secondary';
  };

  return (
    <Card 
      className={cn("cursor-pointer hover:shadow-md transition-shadow", className)}
      onClick={() => onClick?.(event)}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center">
          <Badge variant={getStatusColor()}>
            {event.errorType}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </div>
        </div>
        <CardTitle className="text-sm font-semibold mt-2 line-clamp-2">
          {event.message}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2">
        {event.browser && (
          <div className="text-xs text-muted-foreground mb-1">
            {`${event.browser} ${event.browserVersion || ''}`}
          </div>
        )}
        {event.os && (
          <div className="text-xs text-muted-foreground">
            {`${event.os} ${event.osVersion || ''}`}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-2">
        <div className="w-full flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            {getDeviceIcon()}
            <span>{event.deviceType || 'Unknown device'}</span>
          </div>
          {event.userContext?.userId && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>User: {event.userContext.userId}</span>
            </div>
          )}
          {event.statusCode && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Status: {event.statusCode}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 