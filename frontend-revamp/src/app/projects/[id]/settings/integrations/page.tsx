'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SettingsLayout } from '@/components/layout/settings-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiCheck, FiLink, FiBriefcase, FiXCircle } from 'react-icons/fi';
import { IntegrationsAPI } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function IntegrationsSettingsPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  // State untuk form Jira
  const [jiraBaseUrl, setJiraBaseUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jiraConnected, setJiraConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch existing config
  useEffect(() => {
    const fetchJiraConfig = async () => {
      try {
        setIsLoading(true);
        const config = await IntegrationsAPI.getJiraConfig(projectId);
        if (config.success && config.connected) {
          setJiraConnected(true);
          if (config.baseUrl) setJiraBaseUrl(config.baseUrl);
          if (config.email) setJiraEmail(config.email);
          if (config.projectKey) setJiraProjectKey(config.projectKey);
        }
      } catch (err) {
        console.error('Error fetching Jira config:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJiraConfig();
  }, [projectId]);
  
  // Handle save Jira config
  const handleSaveJiraConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validasi input
    if (!jiraBaseUrl || !jiraEmail || !jiraApiToken || !jiraProjectKey) {
      setError('Semua field harus diisi');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await IntegrationsAPI.saveJiraConfig(projectId, {
        baseUrl: jiraBaseUrl,
        email: jiraEmail,
        apiToken: jiraApiToken,
        projectKey: jiraProjectKey
      });
      
      if (response.success) {
        toast.success('Konfigurasi Jira berhasil disimpan');
        setJiraConnected(true);
        setJiraApiToken(''); // Clear token dari form setelah disimpan
      }
    } catch (err: unknown) {
      console.error('Error saving Jira config:', err);
      const error = err as Error;
      setError(error.message || 'Gagal menyimpan konfigurasi Jira');
      toast.error('Gagal menyimpan konfigurasi Jira');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle disconnect Jira
  const handleDisconnectJira = async () => {
    try {
      setIsSubmitting(true);
      const response = await IntegrationsAPI.deleteJiraConfig(projectId);
      
      if (response.success) {
        toast.success('Integrasi Jira berhasil dinonaktifkan');
        setJiraConnected(false);
        setJiraBaseUrl('');
        setJiraEmail('');
        setJiraApiToken('');
        setJiraProjectKey('');
      }
    } catch (err: unknown) {
      console.error('Error disconnecting Jira:', err);
      toast.error('Gagal menonaktifkan integrasi Jira');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DashboardLayout projectId={projectId}>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold mb-1">Integrasi</h1>
            <p className="text-muted-foreground">
              Integrasikan LogRaven dengan layanan eksternal untuk meningkatkan alur kerja Anda.
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Jira Integration */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center">
                  <FiBriefcase className="mr-2 h-5 w-5" />
                  Jira
                </CardTitle>
                <CardDescription>
                  Buat dan tautkan Jira issues dari error di LogRaven.
                </CardDescription>
              </div>
              {jiraConnected && (
                <div className="flex items-center bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-500 px-3 py-1 rounded-full text-sm">
                  <FiCheck className="mr-1 h-4 w-4" />
                  Terhubung
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="ml-2">Memuat konfigurasi...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveJiraConfig} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jiraBaseUrl">Jira Base URL</Label>
                    <Input
                      id="jiraBaseUrl"
                      placeholder="https://your-company.atlassian.net"
                      value={jiraBaseUrl}
                      onChange={(e) => setJiraBaseUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL Jira Anda, seperti https://your-company.atlassian.net
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jiraEmail">Email</Label>
                    <Input
                      id="jiraEmail"
                      type="email"
                      placeholder="your-email@company.com"
                      value={jiraEmail}
                      onChange={(e) => setJiraEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Email yang digunakan untuk login ke Jira
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jiraApiToken">
                      API Token {jiraConnected && !jiraApiToken && "(Tidak perlu diisi jika hanya update data lain)"}
                    </Label>
                    <Input
                      id="jiraApiToken"
                      type="password"
                      placeholder={jiraConnected ? "••••••••••••••••" : "API Token dari Atlassian"}
                      value={jiraApiToken}
                      onChange={(e) => setJiraApiToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Token API dapat diambil dari <a href="https://id.atlassian.com/manage/api-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Atlassian Account Settings</a>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jiraProjectKey">Project Key</Label>
                    <Input
                      id="jiraProjectKey"
                      placeholder="PRJ"
                      value={jiraProjectKey}
                      onChange={(e) => setJiraProjectKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kode Project di Jira, biasanya 2-4 huruf kapital (contoh: PRJ)
                    </p>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">○</span>
                          Menyimpan...
                        </>
                      ) : jiraConnected ? (
                        <>
                          <FiCheck className="mr-2 h-4 w-4" />
                          Update Konfigurasi
                        </>
                      ) : (
                        <>
                          <FiLink className="mr-2 h-4 w-4" />
                          Hubungkan Jira
                        </>
                      )}
                    </Button>
                    
                    {jiraConnected && (
                      <Button 
                        type="button"
                        variant="destructive"
                        onClick={handleDisconnectJira}
                        disabled={isSubmitting}
                      >
                        <FiXCircle className="mr-2 h-4 w-4" />
                        Putuskan
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
  );
} 