'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FiArrowLeft, FiMail, FiSend, FiAlertCircle } from 'react-icons/fi';
import { useNotificationsStore } from '@/lib/store';

export default function NotificationsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { 
    settings, 
    isLoading, 
    error: storeError,
    fetchSettings,
    updateSettings,
    testNotification,
    clearError
  } = useNotificationsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings(projectId);
  }, [projectId, fetchSettings]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      clearError();
      
      await updateSettings(projectId, settings);
      
      setSuccess('Pengaturan notifikasi berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving notification settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async (type: 'email' | 'slack') => {
    if (!settings) return;
    
    try {
      if (type === 'email') {
        setIsTestingEmail(true);
      } else {
        setIsTestingSlack(true);
      }
      
      clearError();
      
      await testNotification(projectId, type);
      
      setSuccess(`Notifikasi ${type === 'email' ? 'email' : 'Slack'} tes berhasil dikirim`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(`Error testing ${type} notification:`, err);
    } finally {
      if (type === 'email') {
        setIsTestingEmail(false);
      } else {
        setIsTestingSlack(false);
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Memuat pengaturan notifikasi...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!settings) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <FiAlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Gagal memuat pengaturan</h2>
          <p className="mb-4">Terjadi kesalahan saat memuat pengaturan notifikasi.</p>
          <Button onClick={() => router.push(`/projects/${projectId}`)}>
            Kembali ke Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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
          </div>
          
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>

        {storeError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
            {storeError}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 mb-6 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiMail className="mr-2 h-5 w-5" />
                Notifikasi Email
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="text-base">
                    Aktifkan Notifikasi Email
                  </Label>
                  <Switch 
                    id="email-notifications" 
                    checked={settings.email}
                    onCheckedChange={(checked: boolean) => updateSettings(projectId, { email: checked })}
                  />
                </div>
                
                {settings.email && (
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestNotification('email')}
                      disabled={isTestingEmail}
                    >
                      <FiSend className="mr-2 h-4 w-4" />
                      {isTestingEmail ? 'Mengirim...' : 'Kirim Email Tes'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Slack Notifications */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiAlertCircle className="mr-2 h-5 w-5" />
                Notifikasi Slack
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-notifications" className="text-base">
                    Aktifkan Notifikasi Slack
                  </Label>
                  <Switch 
                    id="slack-notifications" 
                    checked={settings.slack}
                    onCheckedChange={(checked: boolean) => updateSettings(projectId, { slack: checked })}
                  />
                </div>
                
                {settings.slack && (
                  <>
                    <div>
                      <Label htmlFor="slack-webhook" className="text-sm font-medium mb-1 block">
                        Slack Webhook URL
                      </Label>
                      <Input 
                        id="slack-webhook"
                        value={settings.slackWebhookUrl || ''}
                        onChange={(e) => updateSettings(projectId, { slackWebhookUrl: e.target.value })}
                        placeholder="https://hooks.slack.com/services/xxx/yyy/zzz"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dapatkan webhook URL dari Slack Apps &gt; Incoming Webhooks
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestNotification('slack')}
                        disabled={isTestingSlack || !settings.slackWebhookUrl}
                      >
                        <FiSend className="mr-2 h-4 w-4" />
                        {isTestingSlack ? 'Mengirim...' : 'Kirim Slack Tes'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Notification Settings */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiAlertCircle className="mr-2 h-5 w-5" />
                Pengaturan Notifikasi
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base">Notifikasi Untuk</Label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="notify-new-error"
                        checked={settings.notifyOnNewError}
                        onCheckedChange={(checked: boolean) => updateSettings(projectId, { notifyOnNewError: checked })}
                      />
                      <Label htmlFor="notify-new-error">Error baru</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="notify-resolved-error"
                        checked={settings.notifyOnResolvedError}
                        onCheckedChange={(checked: boolean) => updateSettings(projectId, { notifyOnResolvedError: checked })}
                      />
                      <Label htmlFor="notify-resolved-error">Error yang diselesaikan</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="minimum-error-level" className="text-base mb-2 block">
                    Level Error Minimum
                  </Label>
                  <select
                    id="minimum-error-level"
                    value={settings.minimumErrorLevel}
                    onChange={(e) => updateSettings(projectId, { minimumErrorLevel: e.target.value as 'info' | 'warning' | 'error' | 'fatal' })}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="fatal">Fatal</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Hanya error dengan level sama atau lebih tinggi dari ini yang akan mengirim notifikasi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 