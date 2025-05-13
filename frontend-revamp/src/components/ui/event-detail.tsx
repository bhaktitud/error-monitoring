import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { FiAlertTriangle, FiClock, FiCopy, FiGlobe, FiMonitor, FiServer, FiSmartphone } from 'react-icons/fi';
import { toast } from 'sonner';
import { Event } from '@/lib/api';

interface EventDetailProps extends Partial<Event> {
  showCopyButton?: boolean;
}

export const EventDetail: FC<EventDetailProps> = ({
  id,
  errorType,
  message,
  timestamp,
  stacktrace,
  statusCode,
  userContext,
  tags,
  browser,
  browserVersion,
  os,
  osVersion,
  deviceType,
  url,
  method,
  path,
  environment,
  release,
  showCopyButton = true
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('id-ID');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <FiAlertTriangle className="mr-2 h-5 w-5 text-destructive" />
          {errorType}
          {statusCode && (
            <Badge className="ml-2" variant={Number(statusCode) >= 500 ? "destructive" : "outline"}>
              {statusCode}
            </Badge>
          )}
        </CardTitle>
        {showCopyButton && id && (
          <Badge
            className="cursor-pointer"
            variant="outline"
            onClick={() => copyToClipboard(id, 'Event ID')}
          >
            <FiCopy className="mr-1 h-3 w-3" />
            Copy ID
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Message</h3>
          <p className="text-sm">{message}</p>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <FiClock className="mr-1 h-4 w-4" />
          {formatDate(timestamp)}
        </div>

        {/* Browser & Device Info */}
        {(browser || os || deviceType) && (
          <div className="border rounded-md p-3 space-y-2">
            <h3 className="text-sm font-medium">Device Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              {browser && (
                <div className="flex items-center">
                  <FiMonitor className="mr-1 h-4 w-4 text-gray-500" />
                  <span className="mr-1 text-gray-500">Browser:</span>
                  {browser} {browserVersion && `v${browserVersion}`}
                </div>
              )}
              {os && (
                <div className="flex items-center">
                  <FiServer className="mr-1 h-4 w-4 text-gray-500" />
                  <span className="mr-1 text-gray-500">OS:</span>
                  {os} {osVersion}
                </div>
              )}
              {deviceType && (
                <div className="flex items-center">
                  <FiSmartphone className="mr-1 h-4 w-4 text-gray-500" />
                  <span className="mr-1 text-gray-500">Device:</span>
                  {deviceType}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Request Info */}
        {(url || method || path) && (
          <div className="border rounded-md p-3 space-y-2">
            <h3 className="text-sm font-medium">Request Information</h3>
            {url && (
              <div className="flex items-start text-sm mb-1">
                <FiGlobe className="mr-1 h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <span className="mr-1 text-gray-500">URL:</span>
                  <span className="break-all">{url}</span>
                </div>
              </div>
            )}
            {(method || path) && (
              <div className="flex items-center text-sm">
                {method && (
                  <Badge variant="outline" className="mr-2">
                    {method}
                  </Badge>
                )}
                {path && <span className="break-all">{path}</span>}
              </div>
            )}
          </div>
        )}

        {/* Environment & Release */}
        {(environment || release) && (
          <div className="flex flex-wrap gap-2">
            {environment && (
              <Badge variant="secondary">
                ENV: {environment}
              </Badge>
            )}
            {release && (
              <Badge variant="secondary">
                Release: {release}
              </Badge>
            )}
          </div>
        )}

        {/* User Context & Tags */}
        <div className="flex flex-wrap gap-2">
          {userContext && Object.keys(userContext).length > 0 && (
            <Badge variant="outline" onClick={() => copyToClipboard(JSON.stringify(userContext), 'User Context')}>
              <FiCopy className="mr-1 h-3 w-3" />
              User Context
            </Badge>
          )}
          
          {tags && Object.keys(tags).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(tags).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Stacktrace - Collapsed/Expandable */}
        {stacktrace && (
          <details className="group">
            <summary className="list-none cursor-pointer flex items-center text-sm font-medium">
              <div className="flex items-center border px-2 py-1 rounded-md hover:bg-gray-50">
                <svg 
                  className="h-4 w-4 mr-1 transition-transform group-open:rotate-90" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Show Stacktrace
              </div>
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded-md overflow-x-auto">
              <pre className="text-xs whitespace-pre-wrap">{stacktrace}</pre>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}; 