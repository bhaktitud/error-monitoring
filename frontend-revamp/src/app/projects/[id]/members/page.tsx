'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectsAPI } from '@/lib/api';
import { FiArrowLeft, FiPlus, FiUser, FiMail, FiTrash2 } from 'react-icons/fi';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
  };
}

export default function MembersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

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

    fetchMembers();
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
      const newMember = await ProjectsAPI.inviteMember(projectId, inviteEmail, inviteRole);
      setMembers(prev => [...prev, newMember]);
      setInviteSuccess('Berhasil mengundang anggota baru');
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

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/projects/${projectId}`)}
              className="mr-4"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Anggota Tim</h1>
          </div>
          
          {!showInviteForm && (
            <Button onClick={() => setShowInviteForm(true)}>
              <FiPlus className="mr-2 h-4 w-4" />
              Undang Anggota
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        {showInviteForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">Undang Anggota Tim</h2>
              
              {inviteError && (
                <div className="bg-red-50 p-3 rounded-md mb-4">
                  <p className="text-red-600 text-sm">{inviteError}</p>
                </div>
              )}
              
              {inviteSuccess && (
                <div className="bg-green-50 p-3 rounded-md mb-4">
                  <p className="text-green-600 text-sm">{inviteSuccess}</p>
                </div>
              )}
              
              <form onSubmit={handleInviteMember}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invite-email">
                      Email
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Masukkan email"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invite-role">
                      Role
                    </label>
                    <select
                      id="invite-role"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
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
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
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

        {loading ? (
          <div className="text-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Memuat anggota tim...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
              <FiUser className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="font-medium text-lg mb-2">Belum ada anggota tim</h3>
            <p className="text-gray-500 mb-4">
              Undang anggota tim untuk berkolaborasi pada proyek ini.
            </p>
            <Button onClick={() => setShowInviteForm(true)}>
              <FiPlus className="mr-2 h-4 w-4" />
              Undang Anggota
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiMail className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={
                        member.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }>
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <select
                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.user.email)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 