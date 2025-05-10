'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectsAPI } from '@/lib/api';
import { FiArrowLeft, FiPlus, FiUser, FiMail, FiTrash2, FiClock, FiUserPlus, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  inviter: {
    email: string;
    name: string;
  };
}

export default function MembersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await ProjectsAPI.getProjectMembers(projectId);
        setMembers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching project members:', err);
        setError('Gagal memuat data anggota tim. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    const fetchInvitations = async () => {
      try {
        setLoadingInvites(true);
        const data = await ProjectsAPI.getInvitations(projectId);
        setInvitations(data);
      } catch (err) {
        console.error('Error fetching invitations:', err);
      } finally {
        setLoadingInvites(false);
      }
    };

    fetchMembers();
    fetchInvitations();
  }, [projectId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      setInviteError('Email wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setInviteError(null);
    
    try {
      await ProjectsAPI.inviteMember(projectId, inviteEmail, inviteRole);
      
      // Refresh daftar undangan
      const invitations = await ProjectsAPI.getInvitations(projectId);
      setInvitations(invitations);
      
      setInviteSuccess(`Berhasil mengundang ${inviteEmail}`);
      setInviteEmail('');
      
      // Sembunyikan form setelah beberapa detik
      setTimeout(() => {
        setShowInviteForm(false);
        setInviteSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error inviting member:', err);
      if (err instanceof Error) {
        setInviteError(err.message);
      } else {
        setInviteError('Gagal mengundang anggota. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const updatedMember = await ProjectsAPI.changeMemberRole(projectId, memberId, newRole);
      setMembers(prev => prev.map(member => 
        member.id === memberId ? updatedMember : member
      ));
    } catch (err) {
      console.error('Error changing member role:', err);
      alert('Gagal mengubah role anggota. Silakan coba lagi.');
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${email} dari proyek ini?`)) {
      return;
    }
    
    try {
      await ProjectsAPI.removeMember(projectId, memberId);
      setMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Gagal menghapus anggota. Silakan coba lagi.');
    }
  };
  
  const handleCancelInvitation = async (inviteId: string, email: string) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan undangan untuk ${email}?`)) {
      return;
    }
    
    try {
      await ProjectsAPI.cancelInvitation(projectId, inviteId);
      setInvitations(prev => prev.filter(invite => invite.id !== inviteId));
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      alert('Gagal membatalkan undangan. Silakan coba lagi.');
    }
  };
  
  const handleResendInvitation = async (inviteId: string, email: string) => {
    try {
      const { invite } = await ProjectsAPI.resendInvitation(projectId, inviteId);
      
      // Update undangan dalam daftar
      setInvitations(prev => prev.map(inviteItem => 
        inviteItem.id === inviteId 
          ? { 
              ...inviteItem, 
              expiresAt: invite.expiresAt 
            } 
          : inviteItem
      ));
      
      alert(`Undangan berhasil dikirim ulang ke ${email}`);
    } catch (err) {
      console.error('Error resending invitation:', err);
      alert('Gagal mengirim ulang undangan. Silakan coba lagi.');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/projects/${projectId}`)}
              className="mr-4 hover:bg-muted transition-colors"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </div>
          
          {!showInviteForm && (
            <Button onClick={() => setShowInviteForm(true)} variant="default">
              <FiPlus className="mr-2 h-4 w-4" />
              Undang Anggota
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 mb-6 rounded-md shadow-sm">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 mr-3 text-destructive" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {showInviteForm && (
          <Card className="mb-6 shadow-md border-0 overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <h2 className="text-lg font-semibold mb-6 text-foreground">Undang Anggota Tim</h2>
              
              {inviteError && (
                <div className="bg-destructive/10 border-l-4 border-destructive p-3 rounded-md mb-4">
                  <div className="flex">
                    <FiAlertCircle className="h-5 w-5 mr-3 text-destructive" />
                    <p className="text-destructive text-sm">{inviteError}</p>
                  </div>
                </div>
              )}
              
              {inviteSuccess && (
                <div className="bg-success/10 border-l-4 border-success p-3 rounded-md mb-4">
                  <div className="flex">
                    <FiCheck className="h-5 w-5 mr-3 text-success" />
                    <p className="text-success text-sm">{inviteSuccess}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleInviteMember}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-2" htmlFor="invite-email">
                      Email
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Masukkan email"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2" htmlFor="invite-role">
                      Role
                    </label>
                    <select
                      id="invite-role"
                      className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowInviteForm(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    variant="default"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      'Undang'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'members' | 'invitations')} className="w-full">
          <TabsList className="mb-6 w-full max-w-md grid grid-cols-2 p-1 rounded-lg">
            <TabsTrigger value="members" className="rounded-md py-2 transition-all">
              <FiUser className="mr-2 h-4 w-4" />
              Anggota ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-md py-2 transition-all">
              <FiClock className="mr-2 h-4 w-4" />
              Undangan ({invitations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-0">
            {loading ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg border border-border shadow-sm">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mr-3"></div>
                <p className="text-muted-foreground">Memuat anggota tim...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center p-12 bg-card rounded-lg border border-border shadow-sm">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                  <FiUser className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium text-lg mb-2 text-foreground">Belum ada anggota tim</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Undang anggota tim untuk berkolaborasi pada proyek ini.
                </p>
                <Button onClick={() => setShowInviteForm(true)} variant="default">
                  <FiPlus className="mr-2 h-4 w-4" />
                  Undang Anggota
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted">
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Anggota
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${
                                  member.role === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                                }`}>
                                  {member.user.email.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-foreground">
                                  {member.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={member.role === 'admin' ? 'secondary' : 'default'} className="px-3 py-1">
                              {member.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-3">
                              <select
                                className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                              </select>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleRemoveMember(member.id, member.user.email)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                      <FiTrash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Hapus anggota</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="invitations" className="mt-0">
            {loadingInvites ? (
              <div className="flex justify-center items-center p-12 bg-card rounded-lg border border-border shadow-sm">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mr-3"></div>
                <p className="text-muted-foreground">Memuat undangan...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center p-12 bg-card rounded-lg border border-border shadow-sm">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                  <FiUserPlus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium text-lg mb-2 text-foreground">Belum ada undangan tertunda</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Undang anggota baru untuk berkolaborasi pada proyek ini.
                </p>
                <Button onClick={() => setShowInviteForm(true)} variant="default">
                  <FiPlus className="mr-2 h-4 w-4" />
                  Undang Anggota
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted">
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Kadaluarsa
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {invitations.map(invite => (
                        <tr key={invite.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback className={`${
                                  invite.role === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                                }`}>
                                  {invite.email.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium text-foreground">{invite.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={invite.role === 'admin' ? 'secondary' : 'default'} className="px-3 py-1">
                              {invite.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">
                              Diundang oleh {invite.inviter.name || invite.inviter.email}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(invite.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">{formatDate(invite.expiresAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleResendInvitation(invite.id, invite.email)}
                                      className="text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                                    >
                                      <FiMail className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Kirim ulang undangan</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleCancelInvitation(invite.id, invite.email)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                      <FiX className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Batalkan undangan</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 