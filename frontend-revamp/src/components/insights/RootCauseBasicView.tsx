'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ErrorInsightAPI } from '@/lib/api';
import { FiAlertTriangle, FiFile, FiInfo, FiClock } from 'react-icons/fi';

interface RootCauseBasicViewProps {
  eventId?: string;
  groupId?: string;
}

interface StackFrame {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  functionName?: string;
  isSourceMapped: boolean;
  originalFileName?: string;
  originalLineNumber?: number;
  originalColumnNumber?: number;
  sourceCode?: string;
}

interface RootCauseAnalysis {
  id: string;
  eventId: string;
  groupId: string;
  analyzedAt: string;
  probableCauses: Array<{
    cause: string;
    probability: number;
    explanation: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    codeExample?: string;
  }>;
  relatedDeployments: string[];
  detailedAnalysis: {
    stackFrames: StackFrame[];
    systemConditions: Record<string, unknown>;
    relatedEvents: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingTime?: number;
  version: number;
  group?: {
    id: string;
    errorType: string;
    message: string;
    count: number;
    status: string;
  };
}

export function RootCauseBasicView({ eventId, groupId }: RootCauseBasicViewProps) {
  const [analysis, setAnalysis] = useState<RootCauseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchRootCauseAnalysis() {
      try {
        setLoading(true);
        setError(null);
        
        let data;
        if (eventId) {
          data = await ErrorInsightAPI.getEventRootCause(eventId);
        } else if (groupId) {
          data = await ErrorInsightAPI.getGroupRootCause(groupId);
        } else {
          throw new Error('Harus menyediakan eventId atau groupId');
        }
        
        setAnalysis(data);
      } catch (err) {
        console.error('Error fetching root cause analysis:', err);
        setError('Gagal memuat analisis akar masalah');
      } finally {
        setLoading(false);
      }
    }

    fetchRootCauseAnalysis();
  }, [eventId, groupId]);

  // Pending state display
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state display
  if (error || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <FiAlertTriangle />
            Error
          </CardTitle>
          <CardDescription>
            {error || 'Tidak dapat memuat analisis akar masalah'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/10 rounded-md">
            <p className="text-destructive">
              Terjadi kesalahan saat memuat analisis. Coba lagi nanti.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Analysis status badge
  const getStatusBadge = () => {
    switch (analysis.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Failed</Badge>;
      default:
        return null;
    }
  };

  // Priority badge for recommendations
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-700">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Root Cause Analysis</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Analisis otomatis untuk mengidentifikasi akar masalah error
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <CardContent className="pt-0">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stacktrace">Stack Trace</TabsTrigger>
            <TabsTrigger value="recommendations">Rekomendasi</TabsTrigger>
            <TabsTrigger value="details">Detail</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Causes section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Kemungkinan Penyebab</h3>
              {analysis.probableCauses.map((cause, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold">{cause.cause}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span>Probabilitas:</span>
                      <Progress value={cause.probability * 100} className="w-20 h-2" />
                      <span>{Math.round(cause.probability * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{cause.explanation}</p>
                </div>
              ))}
            </div>
            
            {/* System info */}
            <div>
              <h3 className="text-sm font-medium mb-2">Kondisi Sistem</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {Object.entries(analysis.detailedAnalysis.systemConditions).map(([key, value]) => 
                  value ? (
                    <div key={key} className="bg-muted/50 p-2 rounded">
                      <span className="font-medium">{key}: </span>
                      <span>{String(value)}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
            
            {/* Processing time */}
            {analysis.processingTime && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FiClock />
                <span>Processed in {(analysis.processingTime / 1000).toFixed(2)} seconds</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stacktrace" className="space-y-4">
            <h3 className="text-sm font-medium">Stack Frames</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analysis.detailedAnalysis.stackFrames.map((frame, index) => (
                <div 
                  key={index} 
                  className={`border rounded-md p-3 ${index === 0 ? 'border-primary/50 bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <FiFile size={14} />
                      <h4 className="font-medium text-sm truncate max-w-[200px]" title={frame.fileName}>
                        {frame.fileName}
                      </h4>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Line: {frame.lineNumber} {frame.columnNumber ? `Col: ${frame.columnNumber}` : ''}
                    </div>
                  </div>
                  
                  {frame.functionName && (
                    <div className="text-xs mb-1">
                      <span className="text-muted-foreground">Function: </span>
                      <code className="bg-muted p-1 rounded">{frame.functionName}</code>
                    </div>
                  )}
                  
                  {frame.isSourceMapped && frame.originalFileName && (
                    <div className="mt-2 p-2 bg-muted/20 rounded text-xs">
                      <div className="flex items-center gap-1 text-primary mb-1">
                        <FiInfo size={14} />
                        <span>Source mapped to:</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{frame.originalFileName}</span>
                        <span>Line: {frame.originalLineNumber} {frame.originalColumnNumber ? `Col: ${frame.originalColumnNumber}` : ''}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <h3 className="text-sm font-medium">Rekomendasi Perbaikan</h3>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold">{rec.action}</h4>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  
                  {rec.codeExample && (
                    <div className="mt-2 bg-muted p-2 rounded">
                      <code className="text-xs whitespace-pre-wrap">{rec.codeExample}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Analyzed at:</span>
                <span>{new Date(analysis.analyzedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Version:</span>
                <span>{analysis.version}</span>
              </div>
              {analysis.group && (
                <>
                  <Separator />
                  <h3 className="text-sm font-medium">Group Info</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Error Type:</span>
                    <span>{analysis.group.errorType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Count:</span>
                    <span>{analysis.group.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span>{analysis.group.status}</span>
                  </div>
                </>
              )}
              
              {analysis.detailedAnalysis.relatedEvents.length > 0 && (
                <>
                  <Separator />
                  <h3 className="text-sm font-medium">Related Events</h3>
                  <div className="text-sm text-muted-foreground">
                    {analysis.detailedAnalysis.relatedEvents.length} related events found
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="bg-muted/20 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <FiInfo size={12} />
          <span>Analisis otomatis mungkin tidak selalu akurat. Periksa kembali rekomendasi sebelum menerapkannya.</span>
        </div>
      </CardFooter>
    </Card>
  );
} 