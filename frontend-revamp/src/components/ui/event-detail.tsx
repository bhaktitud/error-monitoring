import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { FiAlertTriangle, FiClock, FiCopy } from 'react-icons/fi';
import { toast } from 'sonner';

interface EventDetailProps {
  id: string;
  errorType: string;
  message: string;
  timestamp: string;
  stacktrace?: string;
  userAgent?: string;
  statusCode?: number;
  userContext?: Record<string, unknown>;
  tags?: Record<string, string>;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const EventDetail: FC<EventDetailProps> = ({
  errorType,
  message,
  timestamp,
  stacktrace,
  userAgent,
  statusCode,
  userContext,
  tags
}) => {
  const copyStackTrace = () => {
    if (stacktrace) {
      navigator.clipboard.writeText(stacktrace);
      toast.success('Stack trace berhasil disalin!');
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          <FiAlertTriangle className="mr-2 text-destructive" />
          {errorType}
          {statusCode && <Badge variant="outline" className="ml-2">{statusCode}</Badge>}
        </CardTitle>
        <div className="text-base font-medium mt-2">{message}</div>
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <FiClock className="mr-1" />
          <span>Waktu: {formatDate(timestamp)}</span>
        </div>
      </CardHeader>
      <CardContent>
        {stacktrace && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Stack Trace</h4>
              <button 
                onClick={copyStackTrace}
                className="flex items-center text-xs bg-muted hover:bg-muted/80 text-muted-foreground py-1 px-2 rounded transition-colors"
              >
                <FiCopy className="mr-1 h-3 w-3" />
                Salin
              </button>
            </div>
            <div className="relative group">
              <pre className="bg-card text-card-foreground border border-border p-4 rounded font-mono text-sm overflow-auto max-h-80 whitespace-pre">
                {stacktrace}
              </pre>
            </div>
          </div>
        )}

        {userAgent && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">User Agent</h4>
            <div className="bg-muted p-3 rounded text-sm">{userAgent}</div>
          </div>
        )}

        {userContext && Object.keys(userContext).length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">User Context</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto">
              {JSON.stringify(userContext, null, 2)}
            </pre>
          </div>
        )}

        {tags && Object.keys(tags).length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tags).map(([key, value]) => (
                <Badge key={key} variant="outline" className="bg-muted">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 