import { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { FiAlertTriangle, FiClock, FiUser, FiAlertCircle } from 'react-icons/fi';

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
    <Card className="p-6">
      <div className="flex flex-col items-center text-center">
        <FiAlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </Card>
  );
}; 