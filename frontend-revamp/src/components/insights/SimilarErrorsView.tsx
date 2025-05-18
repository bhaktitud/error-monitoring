'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ErrorInsightAPI } from '@/lib/api';
import Link from 'next/link';
import { FiAlertTriangle, FiSearch, FiExternalLink } from 'react-icons/fi';

interface SimilarErrorsViewProps {
  eventId: string;
  projectId: string;
}

interface SimilarError {
  errorId: string;
  groupId: string;
  errorType: string;
  message: string;
  similarityScore: number;
  commonFrames: number;
  timestamp: string;
}

export function SimilarErrorsView({ eventId, projectId }: SimilarErrorsViewProps) {
  const [similarErrors, setSimilarErrors] = useState<SimilarError[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.7);

  useEffect(() => {
    async function fetchSimilarErrors() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await ErrorInsightAPI.findSimilarErrors(eventId, {
          threshold,
          limit: 10
        });
        
        setSimilarErrors(data.similarErrors);
      } catch (err) {
        console.error('Error fetching similar errors:', err);
        setError('Gagal memuat error yang mirip');
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarErrors();
  }, [eventId, threshold]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <FiAlertTriangle />
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-destructive/20 rounded-md bg-destructive/10 text-center">
            <p>Terjadi kesalahan saat memuat data. Coba lagi nanti.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success but no similar errors
  if (similarErrors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FiSearch />
            Error Serupa
          </CardTitle>
          <CardDescription>
            Analisis untuk menemukan error dengan karakteristik serupa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 border border-dashed rounded-md">
            <p className="text-muted-foreground mb-2">Tidak ditemukan error yang serupa.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Badge variant="outline" className="cursor-pointer" onClick={() => setThreshold(Math.max(0.5, threshold - 0.1))}>
                Turunkan ambang batas ({Math.round(threshold * 100)}%)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FiSearch />
            Error Serupa ({similarErrors.length})
          </CardTitle>
          <Badge variant="outline">
            Ambang kemiripan: {Math.round(threshold * 100)}%
          </Badge>
        </div>
        <CardDescription>
          Error lain dengan karakteristik serupa
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-3 flex justify-end gap-2">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => setThreshold(Math.min(0.9, threshold + 0.1))}
          >
            + Tingkatkan ambang batas
          </Badge>
          <Badge 
            variant="outline"
            className="cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => setThreshold(Math.max(0.5, threshold - 0.1))}
          >
            - Turunkan ambang batas
          </Badge>
        </div>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {similarErrors.map((similarError) => (
              <div 
                key={similarError.errorId} 
                className="border rounded-md p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      <Badge variant="secondary" className="font-normal">
                        {similarError.errorType}
                      </Badge>
                    </h4>
                    <p className="text-sm mt-1 line-clamp-2">{similarError.message}</p>
                  </div>
                  <Link 
                    href={`/projects/${projectId}/groups/${similarError.groupId}`}
                    target="_blank"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <FiExternalLink size={16} />
                  </Link>
                </div>
                
                <div className="mt-2 flex gap-2 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                      <span>Kemiripan</span>
                      <span>{Math.round(similarError.similarityScore * 100)}%</span>
                    </div>
                    <Progress 
                      value={similarError.similarityScore * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs">
                    <Badge variant="outline" className="bg-primary/5">
                      {similarError.commonFrames} kesamaan frame
                    </Badge>
                    
                    <Badge variant="outline" className="bg-muted/50">
                      {new Date(similarError.timestamp).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 