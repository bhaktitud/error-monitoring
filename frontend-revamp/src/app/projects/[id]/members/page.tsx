'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectsAPI } from '@/lib/api';
import { FiArrowLeft, FiPlus, FiUser, FiMail, FiTrash2, FiClock, FiUserPlus, FiX, FiCheck, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSession } from '@/lib/auth';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    avatar?: string;
  };
  isCurrentUser?: boolean;
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
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deleteInviteDialogOpen, setDeleteInviteDialogOpen] = useState(false);
  const [inviteToDelete, setInviteToDelete] = useState<{id: string, email: string} | null>(null);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{id: string, email: string} | null>(null);
  const [resendInviteDialogOpen, setResendInviteDialogOpen] = useState(false);
  const [inviteToResend, setInviteToResend] = useState<{id: string, email: string} | null>(null);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [isProjectOwner, setIsProjectOwner] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await ProjectsAPI.getProjectMembers(projectId);
        
        // Identifikasi peran pengguna saat ini
        let loggedInUserId = '';
        try {
          const session = await getSession();
          if (session) {
            const userData = JSON.parse(atob(session.split('.')[1]));
            loggedInUserId = userData.userId;
          }
        } catch (e) {
          console.error('Error parsing user session:', e);
        }
        
        // Tandai anggota saat ini dan tetapkan peran
        const updatedMembers = data.map(member => {
          if (member.user.id === loggedInUserId) {
            setCurrentUserRole(member.role);
            return { ...member, isCurrentUser: true };
          }
          return { ...member, isCurrentUser: false };
        });
        
        // Cek apakah pengguna adalah project owner
        setIsProjectOwner(data.some(member => 
          member.user.id === loggedInUserId && member.isOwner === true
        ));
        
        setMembers(updatedMembers);
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
    setMemberToDelete({ id: memberId, email });
    setDeleteMemberDialogOpen(true);
  };
  
  const confirmRemoveMember = async () => {
    if (!memberToDelete) return;
    
    try {
      await ProjectsAPI.removeMember(projectId, memberToDelete.id);
      setMembers(prev => prev.filter(member => member.id !== memberToDelete.id));
      setDeleteMemberDialogOpen(false);
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Gagal menghapus anggota. Silakan coba lagi.');
    }
  };
  
  const handleCancelInvitation = async (inviteId: string, email: string) => {
    setInviteToDelete({ id: inviteId, email });
    setDeleteInviteDialogOpen(true);
  };
  
  const confirmCancelInvitation = async () => {
    if (!inviteToDelete) return;
    
    try {
      await ProjectsAPI.cancelInvitation(projectId, inviteToDelete.id);
      setInvitations(prev => prev.filter(invite => invite.id !== inviteToDelete.id));
      setDeleteInviteDialogOpen(false);
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      alert('Gagal membatalkan undangan. Silakan coba lagi.');
    }
  };
  
  const handleResendInvitation = async (inviteId: string, email: string) => {
    setInviteToResend({ id: inviteId, email });
    setResendInviteDialogOpen(true);
  };
  
  const confirmResendInvitation = async () => {
    if (!inviteToResend) return;
    
    try {
      setConfirmLoading(true);
      setResendingInvite(inviteToResend.id);
      const { invite } = await ProjectsAPI.resendInvitation(projectId, inviteToResend.id);
      
      // Update undangan dalam daftar
      setInvitations(prev => prev.map(inviteItem => 
        inviteItem.id === inviteToResend.id 
          ? { 
              ...inviteItem, 
              expiresAt: invite.expiresAt 
            } 
          : inviteItem
      ));
      
      setResendInviteDialogOpen(false);
      
      // Tampilkan toast sukses
      toast.success(`Undangan berhasil dikirim ulang ke ${inviteToResend.email}`, {
        description: "Email undangan telah dikirim ke alamat penerima",
        duration: 4000,
      });
      
      // Tampilkan efek loading untuk beberapa detik
      setTimeout(() => {
        setResendingInvite(null);
        setConfirmLoading(false);
      }, 1500);
    } catch (err) {
      console.error('Error resending invitation:', err);
      setResendInviteDialogOpen(false);
      
      // Tampilkan toast error
      toast.error('Gagal mengirim ulang undangan', {
        description: 'Terjadi kesalahan saat mengirim email undangan. Silakan coba lagi.',
        duration: 5000,
      });
      
      setResendingInvite(null);
      setConfirmLoading(false);
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

  // Fungsi untuk memeriksa apakah pengguna saat ini memiliki izin admin
  const hasAdminPermission = () => {
    return isProjectOwner || currentUserRole === 'admin';
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6 ">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold">Anggota Tim</h1>
          </div>
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
                    <Label htmlFor="invite-email" className="mb-2">
                      Email
                    </Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Masukkan email"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite-role" className="mb-2">
                      Role
                    </Label>
                    <Select
                      value={inviteRole}
                      onValueChange={setInviteRole}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full" id="invite-role">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
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

          <div className="mb-4 flex items-center justify-between">
          <TabsList className="w-full max-w-md grid grid-cols-2 p-1 rounded-lg">
            <TabsTrigger value="members" className="rounded-md py-2 transition-all">
              <FiUser className="mr-2 h-4 w-4" />
              Anggota ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-md py-2 transition-all">
              <FiClock className="mr-2 h-4 w-4" />
              Undangan ({invitations.length})
            </TabsTrigger>
          </TabsList>
            {!showInviteForm && (
              <Button onClick={() => setShowInviteForm(true)} variant="default">
                <FiPlus className="mr-2 h-4 w-4" />
                Undang Anggota
              </Button>
            )}
          </div>

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
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>
                          Anggota
                        </TableHead>
                        <TableHead>
                          Role
                        </TableHead>
                        <TableHead>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-card divide-y divide-border">
                      {members.map((member) => (
                        <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 cursor-pointer" onClick={() => setSelectedMember(member)}>
                                {member.user.avatar ? (
                                  <img src={member.user.avatar} alt={member.user.email} className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                  <AvatarFallback className={`${
                                    member.role === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                                  }`}>
                                    {member.user.email.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="ml-4 cursor-pointer" onClick={() => setSelectedMember(member)}>
                                <div className="text-sm font-medium text-foreground">
                                  {member.user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {hasAdminPermission() && !member.isCurrentUser && (
                                <>
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) => handleRoleChange(member.id, value)}
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleRemoveMember(member.id, member.user.email)}
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors ml-3"
                                        >
                                          <FiTrash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Hapus anggota</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              )}
                              {(!hasAdminPermission() || member.isCurrentUser) && (
                                <Badge variant={member.role === 'admin' ? 'secondary' : 'default'} className="px-3 py-1">
                                  {member.role === 'admin' ? 'Admin' : 'Member'}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {hasAdminPermission() && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleResendInvitation(member.id, member.user.email)}
                                        className="text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                                        disabled={resendingInvite === member.id}
                                      >
                                        {resendingInvite === member.id ? (
                                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                        ) : (
                                          <FiMail className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Kirim ulang undangan</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {(!hasAdminPermission() || member.isCurrentUser) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleCancelInvitation(member.id, member.user.email)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors ml-2"
                                      >
                                        <FiX className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Batalkan undangan</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>
                          Email
                        </TableHead>
                        <TableHead>
                          Role
                        </TableHead>
                        <TableHead>
                          Status
                        </TableHead>
                        <TableHead>
                          Kadaluarsa
                        </TableHead>
                        <TableHead>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-card divide-y divide-border">
                      {invitations.map(invite => (
                        <TableRow key={invite.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <Badge variant={invite.role === 'admin' ? 'secondary' : 'default'} className="px-3 py-1">
                              {invite.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-foreground">
                              Diundang oleh {invite.inviter.name || invite.inviter.email}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(invite.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-foreground">{formatDate(invite.expiresAt)}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {hasAdminPermission() && (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleResendInvitation(invite.id, invite.email)}
                                          className="text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                                          disabled={resendingInvite === invite.id}
                                        >
                                          {resendingInvite === invite.id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                          ) : (
                                            <FiMail className="h-4 w-4" />
                                          )}
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
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors ml-2"
                                        >
                                          <FiX className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Batalkan undangan</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              )}
                              {!hasAdminPermission() && (
                                <div className="text-sm text-muted-foreground">
                                  Menunggu respons
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Anggota</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                {selectedMember.user.avatar ? (
                  <img src={selectedMember.user.avatar} alt={selectedMember.user.email} className="h-24 w-24 rounded-full object-cover" />
                ) : (
                  <AvatarFallback className="text-2xl">
                    {selectedMember.user.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-lg font-semibold">{selectedMember.user.email}</div>
              <div className="text-sm text-muted-foreground">Role: {selectedMember.role === 'admin' ? 'Admin' : 'Member'}</div>
            </div>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="w-full mt-4">Tutup</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
      
      {/* Hapus Undangan Dialog */}
      <Dialog open={deleteInviteDialogOpen} onOpenChange={setDeleteInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Batalkan Undangan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan undangan untuk {inviteToDelete?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-3 bg-destructive/10 rounded-md mb-2">
            <FiAlertTriangle className="text-destructive mr-2 h-5 w-5 flex-shrink-0" />
            <p className="text-sm text-destructive">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteInviteDialogOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelInvitation}
              className="flex-1"
            >
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hapus Anggota Dialog */}
      <Dialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Anggota</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {memberToDelete?.email} dari proyek ini?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-3 bg-destructive/10 rounded-md mb-2">
            <FiAlertTriangle className="text-destructive mr-2 h-5 w-5 flex-shrink-0" />
            <p className="text-sm text-destructive">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteMemberDialogOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRemoveMember}
              className="flex-1"
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Kirim Ulang Undangan Dialog */}
      <Dialog open={resendInviteDialogOpen} onOpenChange={(open) => {
        // Jangan tutup dialog saat proses loading
        if (confirmLoading) return;
        setResendInviteDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kirim Ulang Undangan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengirim ulang undangan kepada {inviteToResend?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md mb-2 border border-blue-200 dark:border-blue-800">
            <FiMail className="text-primary mr-2 h-5 w-5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">Email undangan baru akan dikirim dengan masa berlaku 24 jam.</p>
          </div>
          <DialogFooter className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setResendInviteDialogOpen(false)}
              className="flex-1"
              disabled={confirmLoading}
            >
              Batal
            </Button>
            <Button 
              variant="default" 
              onClick={confirmResendInvitation}
              className="flex-1"
              disabled={confirmLoading}
            >
              {confirmLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                  Mengirim...
                </>
              ) : (
                'Kirim Ulang'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 