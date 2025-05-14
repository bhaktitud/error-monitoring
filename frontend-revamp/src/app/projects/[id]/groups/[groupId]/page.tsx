'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Comment } from '@/components/ui/comment';
import { Badge } from '@/components/ui/badge';
import { FiArrowLeft, FiCheck, FiEyeOff, FiMessageCircle, FiUser, FiAlertTriangle, FiLoader, FiCopy, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { GroupsAPI, ProjectsAPI } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ErrorCorrelationChart } from '@/components/insights/ErrorCorrelationChart';
import { UserImpactMetrics } from '@/components/insights/UserImpactMetrics';

interface UserContext {
  [key: string]: unknown;
}

interface Tags {
  [key: string]: unknown;
}

interface Event {
  id: string;
  errorType: string;
  message: string;
  timestamp: string;
  stacktrace?: string;
  userAgent?: string;
  statusCode?: number;
  userContext?: UserContext;
  tags?: Tags;
  code?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    user: {
      id: string;
      email: string;
    };
  };
}

interface ErrorGroup {
  id: string;
  errorType: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status: 'open' | 'resolved' | 'ignored';
  assignedTo?: string | null;
  statusCode?: number;
  code?: string;
  hasSpike?: boolean;
  spikePercentage?: number;
  spikeTimeframe?: string;
}

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
  };
}

export default function ErrorGroupPage() {
  const params = useParams();
  const projectId = params.id as string;
  const groupId = params.groupId as string;
  const router = useRouter();
  const [errorGroup, setErrorGroup] = useState<ErrorGroup | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canAssign, setCanAssign] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [errorSpike, setErrorSpike] = useState<{
    hasSpike: boolean;
    percentage: number;
    timeframe: string;
  }>({
    hasSpike: false,
    percentage: 0,
    timeframe: '30 menit'
  });

  useEffect(() => {
    const fetchErrorGroup = async () => {
      try {
        setLoading(true);
        // Get error group details
        const data = await GroupsAPI.getGroups(projectId);
        const group = data.find(g => g.id === groupId);
        
        if (!group) {
          throw new Error('Error group not found');
        }
        
        // Set errorGroup dari data API
        setErrorGroup({
          id: group.id,
          errorType: group.errorType,
          message: group.message,
          count: group.count,
          firstSeen: group.firstSeen,
          lastSeen: group.lastSeen,
          status: group.status as 'open' | 'resolved' | 'ignored',
          assignedTo: group.assignedTo,
          statusCode: group.statusCode,
          code: group.code
        });
        
        // Simulasi data spike deteksi (ini harusnya dari API)
        // TODO: Ganti dengan data spike dari API ketika sudah diimplementasi
        // Secara acak simulasikan spike untuk demo
        if (Math.random() > 0.5) {
          setErrorSpike({
            hasSpike: true,
            percentage: Math.floor(Math.random() * 300) + 100, // 100% - 400%
            timeframe: '30 menit'
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching error group:', err);
        setError('Gagal memuat detail error group');
      } finally {
        setLoading(false);
      }
    };

    fetchErrorGroup();
  }, [projectId, groupId]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const data = await GroupsAPI.getGroupEvents(groupId);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    if (!loading && errorGroup) {
      fetchEvents();
    }
  }, [loading, errorGroup, groupId]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const data = await GroupsAPI.getComments(groupId);
        setComments(data);
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoadingComments(false);
      }
    };

    if (!loading && errorGroup) {
      fetchComments();
    }
  }, [loading, errorGroup, groupId]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const data = await ProjectsAPI.getProjectMembers(projectId);
        setMembers(data);
        
        // Set initially selected member if error is assigned
        if (errorGroup?.assignedTo) {
          setSelectedMember(errorGroup.assignedTo);
        } else {
          setSelectedMember('unassigned');
        }

        // Cek apakah user saat ini adalah admin atau pemilik
        // Ambil user ID dari token JWT
        const token = localStorage.getItem('authToken') || '';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userId;
            const currentUser = data.find(member => member.user.id === userId);
            
            if (currentUser) {
              setCanAssign(currentUser.role === 'admin' || currentUser.role === 'owner');
            }
          } catch (error) {
            console.error('Error parsing JWT token:', error);
          }
        }
      } catch (err) {
        console.error('Error fetching project members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    if (!loading && errorGroup) {
      fetchMembers();
    }
  }, [loading, errorGroup, projectId]);

  useEffect(() => {
    // Ambil user ID dari token JWT
    const token = localStorage.getItem('authToken') || '';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (error) {
        console.error('Error parsing JWT token:', error);
      }
    }
  }, []);

  const handleStatusChange = async (newStatus: 'open' | 'resolved' | 'ignored') => {
    try {
      await GroupsAPI.changeGroupStatus(groupId, newStatus);
      setErrorGroup(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Gagal mengubah status error');
    }
  };

  const handleAssign = async () => {
    try {
      setSubmittingAssign(true);
      // Jika nilai 'unassigned', kirim empty string ke API
      const memberIdToSend = selectedMember === 'unassigned' ? '' : selectedMember;
      await GroupsAPI.assignGroup(groupId, memberIdToSend);
      
      setErrorGroup(prev => prev ? { ...prev, assignedTo: memberIdToSend } : null);
      setError(null);
    } catch (err) {
      console.error('Error assigning error group:', err);
      setError('Gagal meng-assign error ke member');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    
    try {
      const newCommentObj = await GroupsAPI.addComment(groupId, newComment.trim());
      
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
      setError(null);
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Gagal mengirim komentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId: string, updatedContent: string) => {
    try {
      const updatedComment = await GroupsAPI.editComment(groupId, commentId, updatedContent);
      
      // Update comments state dengan komentar yang sudah diedit
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
      
      toast.success('Komentar berhasil diperbarui');
    } catch (err) {
      console.error('Error editing comment:', err);
      toast.error('Gagal mengedit komentar');
      throw err; // Re-throw error untuk dihandle oleh komponen Comment
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      await GroupsAPI.deleteComment(groupId, commentId);
      
      // Hapus komentar dari state
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      toast.success('Komentar berhasil dihapus');
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Gagal menghapus komentar');
      throw err; // Re-throw error untuk dihandle oleh komponen Comment
    }
  };

  if (loading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">Memuat data...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!errorGroup) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="flex flex-col items-center justify-center p-10">
          <FiAlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Group Tidak Ditemukan</h2>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/projects/${projectId}/groups`)}
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Error Groups
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout projectId={projectId}>
      {loading ? (
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">Memuat data...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
      ) : errorGroup ? (
        <div className="space-y-6">
          {/* Header dengan navigasi kembali dan status */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/projects/${projectId}/groups`)}
                className="h-9 px-2"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
              </Button>
              {errorGroup.statusCode && (
                <Badge variant={errorGroup.statusCode >= 500 ? "destructive" : "outline"}>
                  {errorGroup.statusCode}
                </Badge>
              )}
              {errorGroup.code && (
                <Badge variant="secondary" className="ml-2 text-sm">
                  {errorGroup.code}
                </Badge>
              )}
              {errorSpike.hasSpike && (
                <Badge variant="destructive" className="ml-2 bg-red-600 animate-pulse">
                  <FiAlertCircle className="mr-1 h-4 w-4" />
                  CRITICAL
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                  <Button 
                variant={errorGroup.status === 'open' ? 'secondary' : 'outline'}
                    size="sm" 
                    onClick={() => handleStatusChange('open')}
                className="h-9"
                disabled={errorGroup.status === 'open'}
                  >
                <FiLoader className="mr-2 h-4 w-4" />
                Open
                  </Button>
                  <Button 
                variant={errorGroup.status === 'resolved' ? 'secondary' : 'outline'}
                    size="sm" 
                    onClick={() => handleStatusChange('resolved')}
                className="h-9"
                disabled={errorGroup.status === 'resolved'}
                  >
                <FiCheck className="mr-2 h-4 w-4" />
                Resolved
                  </Button>
                  <Button 
                variant={errorGroup.status === 'ignored' ? 'secondary' : 'outline'}
                    size="sm" 
                    onClick={() => handleStatusChange('ignored')}
                className="h-9"
                disabled={errorGroup.status === 'ignored'}
                  >
                <FiEyeOff className="mr-2 h-4 w-4" />
                Ignore
                  </Button>
            </div>
          </div>

          {/* Main content - two column layout on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Error details dan events - 2/3 kolom */}
            <div className="lg:col-span-2 space-y-6">
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Card informasi error group */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">{errorGroup.message}</h2>
                        {errorSpike.hasSpike && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                            <FiTrendingUp className="mr-2 h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-red-700 text-sm">
                              🔥 Error ini meningkat <span className="font-bold">{errorSpike.percentage}%</span> dalam {errorSpike.timeframe} terakhir
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <FiAlertTriangle className="mr-1 h-4 w-4" />
                            {errorGroup.count} kejadian
                          </span>
                          <span>•</span>
                          <span>Pertama: {formatDate(errorGroup.firstSeen)}</span>
                          <span>•</span>
                          <span>Terakhir: {formatDate(errorGroup.lastSeen)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              {/* Assignment card */}
                <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center">
                    <FiUser className="mr-2 h-4 w-4" />
                    Ditugaskan Kepada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                {loadingMembers ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                  <div className="space-y-2">
                          <Select
                            value={selectedMember || 'unassigned'}
                            onValueChange={(value) => {
                              console.log('Selected member changed:', value);
                              setSelectedMember(value);
                            }}
                            disabled={!canAssign}
                          >
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder="-- Tidak ada --" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="unassigned">-- Tidak ada --</SelectItem>
                                {members.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                {member.user.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        
                        <Button 
                          onClick={handleAssign} 
                          disabled={
                            !canAssign || 
                            submittingAssign || 
                            (selectedMember === errorGroup.assignedTo) || 
                            (selectedMember === 'unassigned' && errorGroup.assignedTo === null)
                          }
                            className="w-full" 
                        >
                        {submittingAssign ? 'Menyimpan...' : 'Update Assignment'}
                        </Button>
                      
                      {!canAssign && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Hanya admin atau pemilik project yang dapat mengubah assignment.
                        </p>
                    )}
                  </div>
                )}
              </CardContent>
                </Card>
              </div>

              {/* Tab panel untuk menampilkan event details */}
              <div className="bg-card border rounded-md shadow-sm">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-medium">Kejadian Error</h3>
                </div>
                
                {loadingEvents ? (
                  <div className="flex justify-center items-center p-8">
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Tidak ada data kejadian error
                  </div>
                ) : (
                  <div className="divide-y">
                    {events.map((event) => (
                      <div key={event.id} className="p-0">
                        <details className="group">
                          <summary className="flex justify-between items-center p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{event.message.substring(0, 80)}{event.message.length > 80 ? '...' : ''}</span>
                                {event.code && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.code}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">{formatDate(event.timestamp)}</div>
                            </div>
                            <div className="ml-4 transition-transform group-open:rotate-180">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                          </summary>
                          <div className="px-4 pb-4">
                            <div className="space-y-4">
                              {/* Stack trace dengan syntax highlighting */}
                              {event.stacktrace && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium">Stack Trace</h4>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(event.stacktrace || '');
                                        toast.success('Stack trace disalin');
                                      }}
                                    >
                                      <FiCopy className="h-3 w-3 mr-1" /> Salin
                                    </Button>
                                  </div>
                                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                    {event.stacktrace}
                                  </pre>
                                </div>
                              )}
                              
                              {/* User agent info */}
                              {event.userAgent && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">User Agent</h4>
                                  <div className="text-xs bg-muted p-3 rounded-md">
                                    {event.userAgent}
                                  </div>
                                </div>
                              )}
                              
                              {/* User context dengan syntax highlighting */}
                              {event.userContext && Object.keys(event.userContext).length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">User Context</h4>
                                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                    {JSON.stringify(event.userContext, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {/* Tags */}
                              {event.tags && Object.keys(event.tags).length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(event.tags).map(([key, value]) => (
                                      <Badge key={key} variant="secondary" className="text-xs">
                                        {key}: {value as string}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Error Correlation */}
                <ErrorCorrelationChart 
                  projectId={projectId}
                  errorGroupId={groupId}
                />
                
                {/* User Impact */}
                <UserImpactMetrics 
                  projectId={projectId}
                  errorGroupId={groupId}
                />
              </div>

          </div>
          
            {/* Sidebar - 1/3 kolom */}
            <div className="space-y-6">
              
              {/* Komentar */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center">
                    <FiMessageCircle className="mr-2 h-5 w-5 text-primary" />
                    Komentar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                {loadingComments ? (
                  <div className="space-y-4 p-4">
                      <Skeleton className="h-20 w-full rounded-xl" />
                      <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ) : (
                  <>
                      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent mb-0">
                      {comments.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="bg-muted/30 p-4 rounded-full mb-3">
                              <FiMessageCircle className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Belum ada komentar.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Jadilah yang pertama menambahkan komentar.
                            </p>
                          </div>
                      ) : (
                          comments.map((comment) => (
                            <Comment 
                              key={comment.id}
                              id={comment.id}
                              content={comment.content}
                              createdAt={comment.createdAt}
                              author={comment.author}
                              currentUserId={currentUserId}
                              onEdit={handleEditComment}
                              onDelete={handleDeleteComment}
                            />
                          ))
                      )}
                    </div>
                    
                    <div className="border-t bg-muted/10 p-4">
                      <form onSubmit={handleSubmitComment} className="space-y-3">
                        <div className="relative">
                          <Textarea
                            placeholder="Tulis komentar..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px] pr-4 bg-background/60 focus:bg-background transition-all duration-200 resize-none border rounded-xl placeholder:text-muted-foreground/70"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={!newComment.trim() || submittingComment}
                            className="relative overflow-hidden group"
                          >
                            <span className="relative z-10 flex items-center">
                              {submittingComment ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Mengirim...
                                </>
                              ) : (
                                <>
                                  <FiMessageCircle className="mr-2 h-4 w-4" />
                                  Kirim Komentar
                                </>
                              )}
                            </span>
                          </Button>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10">
          <FiAlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Group Tidak Ditemukan</h2>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/projects/${projectId}/groups`)}
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Error Groups
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
} 