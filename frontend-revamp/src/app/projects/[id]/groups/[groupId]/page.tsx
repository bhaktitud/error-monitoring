'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventDetail } from '@/components/ui/event-detail';
import { Comment } from '@/components/ui/comment';
import { Badge } from '@/components/ui/badge';
import { FiArrowLeft, FiCheck, FiEyeOff, FiMessageCircle, FiUser, FiAlertTriangle, FiLoader } from 'react-icons/fi';
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
        
        setErrorGroup({
          id: group.id,
          errorType: group.errorType,
          message: group.message,
          count: group.count,
          firstSeen: group.firstSeen,
          lastSeen: group.lastSeen,
          status: group.status as 'open' | 'resolved' | 'ignored',
          assignedTo: group.assignedTo,
          statusCode: group.statusCode
        });
        
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
      await GroupsAPI.assignGroup(groupId, selectedMember);
      
      setErrorGroup(prev => prev ? { ...prev, assignedTo: selectedMember } : null);
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
      
      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      setError(null);
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Gagal mengirim komentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  if (!errorGroup) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <p className="text-red-500">Error group tidak ditemukan atau terjadi kesalahan saat memuat data.</p>
          <Button onClick={() => router.back()} className="mt-4">
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali
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
      <div>
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <FiAlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{errorGroup.errorType}</h1>
          <p className="text-foreground mb-4">{errorGroup.message}</p>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Badge variant={
              errorGroup.status === 'resolved' ? 'default' : 
              errorGroup.status === 'ignored' ? 'secondary' : 'destructive'
            }>
              {errorGroup.status === 'open' ? 'Terbuka' : 
               errorGroup.status === 'resolved' ? 'Selesai' : 'Diabaikan'}
            </Badge>
            
            <div className="text-sm text-muted-foreground">
              {errorGroup.count} kemunculan
            </div>
            
            <div className="text-sm text-muted-foreground">
              Pertama: {formatDate(errorGroup.firstSeen)}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Terakhir: {formatDate(errorGroup.lastSeen)}
            </div>
            
            {errorGroup.statusCode && (
              <div className="text-sm text-muted-foreground">
                Status code: {errorGroup.statusCode}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Status:</div>
              {canAssign ? (
                <>
                  <Button 
                    size="sm" 
                    variant={errorGroup.status === 'open' ? 'default' : 'outline'} 
                    onClick={() => handleStatusChange('open')}
                  >
                    Terbuka
                  </Button>
                  <Button 
                    size="sm" 
                    variant={errorGroup.status === 'resolved' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('resolved')}
                  >
                    <FiCheck className="mr-1 h-4 w-4" />
                    Selesai
                  </Button>
                  <Button 
                    size="sm" 
                    variant={errorGroup.status === 'ignored' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('ignored')}
                  >
                    <FiEyeOff className="mr-1 h-4 w-4" />
                    Abaikan
                  </Button>
                </>
              ) : (
                <Badge variant={
                  errorGroup.status === 'resolved' ? 'default' : 
                  errorGroup.status === 'ignored' ? 'secondary' : 'destructive'
                }>
                  {errorGroup.status === 'open' ? 'Terbuka' : 
                  errorGroup.status === 'resolved' ? 'Selesai' : 'Diabaikan'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4">
                  Riwayat Event
                </h2>
                
                {loadingEvents ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Tidak ada event
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <EventDetail key={event.id} 
                        id={event.id}
                        errorType={event.errorType} 
                        message={event.message}
                        timestamp={event.timestamp}
                        stacktrace={event.stacktrace}
                        userAgent={event.userAgent}
                        statusCode={event.statusCode}
                        userContext={event.userContext}
                        tags={event.tags as Record<string, string>}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FiUser className="mr-2 h-5 w-5" />
                  Assigned To
                </h2>
                
                {loadingMembers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ) : (
                  <div>
                    {canAssign ? (
                      <>
                        <div className="mb-2">
                          <Select
                            value={selectedMember || 'none'}
                            onValueChange={(value) => setSelectedMember(value === 'none' ? null : value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="-- Tidak ada --" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-- Tidak ada --</SelectItem>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.user.email} ({member.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="w-full" 
                          onClick={handleAssign}
                          disabled={submittingAssign || selectedMember === errorGroup.assignedTo}
                        >
                          {submittingAssign ? (
                            <>
                              <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>Assign</>
                          )}
                        </Button>
                      </>
                    ) : null}
                    
                    {errorGroup.assignedTo && members.length > 0 && (
                      <div className={`p-3 bg-primary/20 rounded-md text-sm ${!canAssign ? '' : 'mt-4'}`}>
                        <div className="font-medium mb-1">Saat ini di-assign ke:</div>
                        <div>
                          {members.find(m => m.id === errorGroup.assignedTo)?.user.email || 'Unknown'}
                        </div>
                      </div>
                    )}
                    
                    {!errorGroup.assignedTo && !canAssign && (
                      <div className="text-sm text-muted-foreground">
                        Belum ada anggota tim yang ditugaskan.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <FiMessageCircle className="mr-2 h-5 w-5" />
                  Komentar
                </h2>
                
                {loadingComments ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-md" />
                    <Skeleton className="h-20 w-full rounded-md" />
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      {comments.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          Belum ada komentar.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {comments.map((comment) => (
                            <Comment 
                              key={comment.id}
                              id={comment.id}
                              content={comment.content}
                              createdAt={comment.createdAt}
                              author={comment.author}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <form onSubmit={handleSubmitComment}>
                      <Textarea
                        placeholder="Tambahkan komentar..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={submittingComment}
                        className="mb-2"
                      />
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={!newComment.trim() || submittingComment}
                      >
                        {submittingComment ? (
                          <>
                            <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>Kirim Komentar</>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 