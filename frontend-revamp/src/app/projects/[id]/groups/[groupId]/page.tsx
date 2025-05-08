'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventDetail } from '@/components/ui/event-detail';
import { Comment } from '@/components/ui/comment';
import { Badge } from '@/components/ui/badge';
import { FiArrowLeft, FiCheck, FiEyeOff, FiMessageCircle, FiUser } from 'react-icons/fi';
import { GroupsAPI, ProjectsAPI } from '@/lib/api';

interface UserContext {
  [key: string]: unknown;
}

interface Tags {
  [key: string]: string;
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
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Memuat detail error group...</p>
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{errorGroup.errorType}</h1>
          <p className="text-gray-700 mb-4">{errorGroup.message}</p>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Badge variant={
              errorGroup.status === 'resolved' ? 'default' : 
              errorGroup.status === 'ignored' ? 'secondary' : 'destructive'
            }>
              {errorGroup.status === 'open' ? 'Terbuka' : 
               errorGroup.status === 'resolved' ? 'Selesai' : 'Diabaikan'}
            </Badge>
            
            <div className="text-sm text-gray-500">
              {errorGroup.count} kemunculan
            </div>
            
            <div className="text-sm text-gray-500">
              Pertama: {formatDate(errorGroup.firstSeen)}
            </div>
            
            <div className="text-sm text-gray-500">
              Terakhir: {formatDate(errorGroup.lastSeen)}
            </div>
            
            {errorGroup.statusCode && (
              <div className="text-sm text-gray-500">
                Status code: {errorGroup.statusCode}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Status:</div>
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
                  <div className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Memuat events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
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
                        tags={event.tags}
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
                  <div className="text-center py-4">
                    <div className="animate-spin h-5 w-5 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm">Memuat anggota tim...</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2">
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-md mb-2"
                        value={selectedMember || ''}
                        onChange={(e) => setSelectedMember(e.target.value || null)}
                      >
                        <option value="">-- Tidak ada --</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.user.email} ({member.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={handleAssign}
                      disabled={submittingAssign || selectedMember === errorGroup.assignedTo}
                    >
                      {submittingAssign ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>Assign</>
                      )}
                    </Button>
                    
                    {errorGroup.assignedTo && members.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                        <div className="font-medium mb-1">Saat ini di-assign ke:</div>
                        <div>
                          {members.find(m => m.id === errorGroup.assignedTo)?.user.email || 'Unknown'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FiMessageCircle className="mr-2 h-5 w-5" />
                Komentar
              </h2>
              
              {loadingComments ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Memuat komentar...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        Belum ada komentar
                      </div>
                    ) : (
                      <div className="space-y-3">
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
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-2"
                      rows={3}
                      placeholder="Tambahkan komentar..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submittingComment}
                    ></textarea>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={!newComment.trim() || submittingComment}
                    >
                      {submittingComment ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Mengirim...
                        </>
                      ) : (
                        'Kirim Komentar'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 