import { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
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
  const statusColors = {
    open: 'bg-red-100 text-red-800',
    resolved: 'bg-green-100 text-green-800',
    ignored: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <FiAlertTriangle className="mr-2 text-red-500" />
              {errorType}
              {statusCode && <Badge variant="outline" className="ml-2">{statusCode}</Badge>}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600 line-clamp-2">
              {message}
            </CardDescription>
          </div>
          <Badge className={statusColors[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-gray-600 mt-1">
          <FiClock className="mr-1" />
          <span className="mr-3">Pertama dilihat: {formatDate(firstSeen)}</span>
          <FiClock className="mr-1" />
          <span>Terakhir dilihat: {formatDate(lastSeen)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center">
          {assignedTo ? (
            <div className="flex items-center text-sm text-gray-600">
              <FiUser className="mr-1" />
              <span>Ditugaskan ke: {assignedTo}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Belum ditugaskan</div>
          )}
        </div>
        <Badge variant="secondary" className="ml-auto">
          {count} {count > 1 ? 'events' : 'event'}
        </Badge>
      </CardFooter>
    </Card>
  );
}; 