import { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { FiAlertTriangle, FiClock, FiUser } from 'react-icons/fi';

interface ErrorCardProps {
  id: string;
  errorType: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status: 'open' | 'resolved' | 'ignored';
  assignedTo?: string;
  statusCode?: number;
  onClick?: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const ErrorCard: FC<ErrorCardProps> = ({
  id,
  errorType,
  message,
  count,
  firstSeen,
  lastSeen,
  status,
  assignedTo,
  statusCode,
  onClick
}) => {
  const statusVariants = {
    open: 'bg-destructive/20 text-destructive',
    resolved: 'bg-primary/20 text-primary',
    ignored: 'bg-muted text-muted-foreground'
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center">
              <FiAlertTriangle className="mr-2 text-destructive" />
              {errorType}
              {statusCode && <Badge variant="outline" className="ml-2">{statusCode}</Badge>}
            </CardTitle>
            <CardDescription className="mt-1 text-sm line-clamp-2">
              {message}
            </CardDescription>
          </div>
          <Badge className={statusVariants[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <FiClock className="mr-1" />
          <span className="mr-3">Pertama dilihat: {formatDate(firstSeen)}</span>
          <FiClock className="mr-1" />
          <span>Terakhir dilihat: {formatDate(lastSeen)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center">
          {assignedTo ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <FiUser className="mr-1" />
              <span>Ditugaskan ke: {assignedTo}</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground/70">Belum ditugaskan</div>
          )}
        </div>
        <Badge variant="secondary" className="ml-auto">
          {count} {count > 1 ? 'events' : 'event'}
        </Badge>
      </CardFooter>
    </Card>
  );
}; 