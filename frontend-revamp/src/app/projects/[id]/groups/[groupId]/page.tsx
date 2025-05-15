'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Comment } from '@/components/ui/comment';
import { Badge } from '@/components/ui/badge';
import { FiArrowLeft, FiCheck, FiEyeOff, FiMessageCircle, FiUser, FiAlertTriangle, FiLoader, FiCopy, FiTrendingUp, FiAlertCircle, FiExternalLink, FiLink } from 'react-icons/fi';
import { GroupsAPI, ProjectsAPI, IntegrationsAPI } from '@/lib/api';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface JiraIssue {
  id: string;
  jiraIssueKey: string;
  jiraIssueUrl: string;
  groupId: string;
  errorId: string | null;
  createdAt: string;
  createdBy: {
    email: string;
  };
}

interface ApiError {
  message?: string;
  response?: {
    data?: {
      error?: string;
      details?: {
        errors?: Record<string, string>;
      };
    };
    status?: number;
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
  
  // State untuk Jira integration
  const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([]);
  const [loadingJiraIssues, setLoadingJiraIssues] = useState(false);
  const [jiraModalOpen, setJiraModalOpen] = useState(false);
  const [jiraSummary, setJiraSummary] = useState('');
  const [jiraDescription, setJiraDescription] = useState('');
  const [submittingJiraIssue, setSubmittingJiraIssue] = useState(false);
  const [jiraIssueTypes, setJiraIssueTypes] = useState<Array<{id: string, name: string, iconUrl?: string}>>([]);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState('');
  const [jiraError, setJiraError] = useState<string | null>(null);
  
  // State untuk konfigurasi Jira
  const [jiraConnected, setJiraConnected] = useState(false);
  const [loadingJiraConfig, setLoadingJiraConfig] = useState(true);

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

  // Periksa konfigurasi Jira
  useEffect(() => {
    const checkJiraConfig = async () => {
      try {
        setLoadingJiraConfig(true);
        const config = await IntegrationsAPI.getJiraConfig(projectId);
        setJiraConnected(config.success && config.connected);
      } catch (err) {
        console.error('Error checking Jira config:', err);
        setJiraConnected(false);
      } finally {
        setLoadingJiraConfig(false);
      }
    };
    
    checkJiraConfig();
  }, [projectId]);

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
      setComments(comments => comments.filter(c => c.id !== commentId));
      await GroupsAPI.deleteComment(groupId, commentId);
      toast.success("Komentar berhasil dihapus");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Gagal menghapus komentar");
      
      // Reload comments to restore state
      try {
        const reloadedComments = await GroupsAPI.getComments(groupId);
        setComments(reloadedComments);
      } catch (err) {
        console.error("Error reloading comments:", err);
      }
    }
  };

  // Prepare Jira issue
  const prepareJiraIssue = (event?: Event) => {
    if (!errorGroup) return;
    
    // Reset state
    setJiraError(null);
    setJiraIssueTypes([]);
    setSelectedIssueTypeId('');
    
    const stacktrace = event?.stacktrace || events?.[0]?.stacktrace || '';
    const userContext = event?.userContext 
      ? JSON.stringify(event.userContext, null, 2) 
      : events?.[0]?.userContext 
        ? JSON.stringify(events[0].userContext, null, 2) 
        : '';
    
    setJiraSummary(`Error pada ${errorGroup.errorType}: ${errorGroup.message}`);
    
    const description = `
*Error Type:* ${errorGroup.errorType}
*Message:* ${errorGroup.message}
*Status Code:* ${errorGroup.statusCode || 'N/A'}
*First Seen:* ${new Date(errorGroup.firstSeen).toLocaleString('id-ID')}
*Last Seen:* ${new Date(errorGroup.lastSeen).toLocaleString('id-ID')}
*Occurrence Count:* ${errorGroup.count}

h2. Stacktrace
{code}
${stacktrace || 'Tidak ada stacktrace'}
{code}

${userContext ? `h2. User Context
{code:json}
${userContext}
{code}` : ''}

h2. Link
[Lihat di LogRaven|${window.location.href}]
`;
    
    setJiraDescription(description);
    
    // Load issue types
    fetchJiraIssueTypes();
    
    setJiraModalOpen(true);
  };
  
  // Fetch issue types from project configuration
  const fetchJiraIssueTypes = async () => {
    if (!jiraConnected) return;
    
    try {
      setLoadingIssueTypes(true);
      setJiraError(null);
      
      const result = await IntegrationsAPI.getJiraIssueTypes(projectId);
      
      if (result.success && result.issueTypes && result.issueTypes.length > 0) {
        setJiraIssueTypes(result.issueTypes);
        // Set default issue type (Bug jika ada, atau yang pertama)
        const bugType = result.issueTypes.find(type => type.name.toLowerCase() === 'bug');
        setSelectedIssueTypeId(bugType ? bugType.id : result.issueTypes[0].id);
      } else {
        setJiraError('Tidak ada tipe issue yang tersedia untuk proyek ini');
      }
    } catch (error: unknown) {
      console.error('Error fetching Jira issue types:', error);
      const apiError = error as ApiError;
      setJiraError(apiError.message || 'Gagal mengambil tipe issue Jira');
    } finally {
      setLoadingIssueTypes(false);
    }
  };
  
  // Submit Jira issue
  const handleCreateJiraIssue = async () => {
    if (!errorGroup || !jiraConnected) return;
    
    try {
      setSubmittingJiraIssue(true);
      setJiraError(null);
      
      // Validasi input
      if (!selectedIssueTypeId) {
        setJiraError('Pilih tipe issue terlebih dahulu');
        setSubmittingJiraIssue(false);
        return;
      }
      
      // Get selectedEvent if any, or use the first event
      const eventId = events.length > 0 ? events[0].id : null;
      
      const result = await IntegrationsAPI.createJiraIssue(
        groupId,
        projectId,
        eventId,
        {
          summary: jiraSummary,
          description: jiraDescription,
          issueTypeId: selectedIssueTypeId
        }
      );
      
      // Refresh Jira issues
      fetchJiraIssues();
      
      // Close modal and reset form
      setJiraModalOpen(false);
      setJiraSummary('');
      setJiraDescription('');
      setSelectedIssueTypeId('');
      setJiraIssueTypes([]);
      
      toast.success(`Jira issue ${result.jiraIssue.key} berhasil dibuat!`);
    } catch (error: unknown) {
      console.error('Error creating Jira issue:', error);
      
      // Ambil pesan error dari response jika ada
      const apiError = error as ApiError;
      let errorMessage = 'Gagal membuat Jira issue';
      if (apiError.message) {
        errorMessage = apiError.message;
      } else if (apiError.response && apiError.response.data) {
        // Handle specific error formats
        if (apiError.response.data.details && apiError.response.data.details.errors) {
          const errorDetails = apiError.response.data.details.errors;
          errorMessage = Object.entries(errorDetails)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ');
        } else if (apiError.response.data.error) {
          errorMessage = apiError.response.data.error;
        }
      }
      
      setJiraError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmittingJiraIssue(false);
    }
  };
  
  // Fetch Jira issues
  const fetchJiraIssues = async () => {
    if (!errorGroup) return;
    
    try {
      setLoadingJiraIssues(true);
      const issues = await IntegrationsAPI.getJiraIssues(errorGroup.id);
      setJiraIssues(issues);
    } catch (error) {
      console.error('Error fetching Jira issues:', error);
    } finally {
      setLoadingJiraIssues(false);
    }
  };
  
  // Fetch Jira issues when error group loads
  useEffect(() => {
    if (!loading && errorGroup) {
      fetchJiraIssues();
    }
  }, [loading, errorGroup]);

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
              
              {/* Jira Integration Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center">
                    <FiExternalLink className="mr-2 h-5 w-5 text-primary" />
                    Integrasi Jira
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loadingJiraConfig ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="ml-2 text-sm">Memeriksa konfigurasi...</span>
                      </div>
                    ) : jiraConnected ? (
                      <Button 
                        className="w-full"
                        onClick={() => prepareJiraIssue()}
                      >
                        Buat Jira Issue
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-muted/40 p-3 text-sm text-center rounded-md">
                          <p className="text-muted-foreground">Integrasi Jira belum dikonfigurasi</p>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/projects/${projectId}/settings/integrations`)}
                        >
                          <FiLink className="mr-2 h-4 w-4" />
                          Konfigurasi Jira
                        </Button>
                      </div>
                    )}
                    
                    {loadingJiraIssues ? (
                      <Skeleton className="h-20 w-full" />
                    ) : jiraIssues.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center">
                          <FiExternalLink className="mr-1 h-4 w-4 text-muted-foreground" />
                          Issue Terkait ({jiraIssues.length}):
                        </h4>
                        <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                          {jiraIssues.map(issue => (
                            <li key={issue.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                              <span className="font-medium text-primary">{issue.jiraIssueKey}</span>
                              <div className="flex items-center">
                                <span className="text-xs text-muted-foreground mr-2">
                                  {new Date(issue.createdAt).toLocaleDateString('id-ID')}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {issue.createdBy.email.split('@')[0]}
                                </div>
                                <a 
                                  href={issue.jiraIssueUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 ml-2"
                                  title="Buka di Jira"
                                >
                                  <FiExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : jiraConnected ? (
                      <div className="text-sm text-muted-foreground text-center italic py-4 bg-muted/20 rounded-md">
                        <p>Belum ada issue Jira terkait</p>
                        <p className="text-xs mt-1">Klik tombol di atas untuk membuat issue baru</p>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              
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
      
      {/* Jira Issue Dialog */}
      <Dialog open={jiraModalOpen} onOpenChange={setJiraModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Buat Jira Issue</DialogTitle>
            <DialogDescription>
              Buat issue baru di Jira berdasarkan error ini. Pastikan Anda memiliki akses ke Jira project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {jiraError && (
              <Alert variant="destructive">
                <AlertDescription>{jiraError}</AlertDescription>
              </Alert>
            )}
            
            {loadingIssueTypes ? (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2">Memuat tipe issue...</span>
              </div>
            ) : (
              <>
                {jiraIssueTypes.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="issueType">Tipe Issue</Label>
                    <Select
                      value={selectedIssueTypeId}
                      onValueChange={setSelectedIssueTypeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe issue" />
                      </SelectTrigger>
                      <SelectContent>
                        {jiraIssueTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              {type.iconUrl && (
                                <img src={type.iconUrl} alt={type.name} className="w-4 h-4" />
                              )}
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Pilih tipe issue yang sesuai dengan konfigurasi proyek Jira Anda
                    </p>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Tidak dapat memuat tipe issue. Pastikan konfigurasi Jira Anda sudah benar.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="jiraSummary">Summary</Label>
                  <Input
                    id="jiraSummary"
                    value={jiraSummary}
                    onChange={(e) => setJiraSummary(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jiraDescription">Description</Label>
                  <Textarea
                    id="jiraDescription"
                    rows={10}
                    value={jiraDescription}
                    onChange={(e) => setJiraDescription(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mendukung Jira markdown. Anda dapat mengedit deskripsi sesuai kebutuhan.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJiraModalOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleCreateJiraIssue} 
              disabled={loadingIssueTypes || !selectedIssueTypeId || !jiraSummary || submittingJiraIssue || jiraIssueTypes.length === 0}
            >
              {submittingJiraIssue ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Membuat Issue...
                </>
              ) : 'Buat Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 