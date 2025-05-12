'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { NotificationAPI } from '@/lib/api';
import { FiArrowLeft, FiSend, FiMail, FiSlack, FiAlertCircle } from 'react-icons/fi';

interface NotificationSettings {
  email: boolean;
  slack: boolean;
  slackWebhookUrl?: string;
  notifyOnNewError: boolean;
  notifyOnResolvedError: boolean;
  minimumErrorLevel: 'info' | 'warning' | 'error' | 'fatal';
}

export default function NotificationsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    email: false,
    slack: false,
    slackWebhookUrl: '',
    notifyOnNewError: true,
    notifyOnResolvedError: false,
    minimumErrorLevel: 'error'
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await NotificationAPI.getNotificationSettings(projectId);
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching notification settings:', err);
        setError('Gagal memuat pengaturan notifikasi. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [projectId]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      await NotificationAPI.updateNotificationSettings(projectId, settings);
      
      setSuccess('Pengaturan notifikasi berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Gagal menyimpan pengaturan notifikasi. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async (type: 'email' | 'slack') => {
    try {
      if (type === 'email') {
        setIsTestingEmail(true);
      } else {
        setIsTestingSlack(true);
      }
      
      setError(null);
      
      await NotificationAPI.testNotification(projectId, type);
      
      setSuccess(`Notifikasi ${type === 'email' ? 'email' : 'Slack'} tes berhasil dikirim`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(`Error testing ${type} notification:`, err);
      setError(`Gagal mengirim notifikasi ${type === 'email' ? 'email' : 'Slack'} tes. Silakan coba lagi.`);
    } finally {
      if (type === 'email') {
        setIsTestingEmail(false);
      } else {
        setIsTestingSlack(false);
      }
    }
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold">Notifikasi</h1>
          </div>
          
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving || loading}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 mb-6 rounded-md">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Memuat pengaturan notifikasi...</p>
          </div>
        ) : (
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
                      onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, email: checked }))}
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
                  <FiSlack className="mr-2 h-5 w-5" />
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
                      onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, slack: checked }))}
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
                          onChange={(e) => setSettings(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
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
                          onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, notifyOnNewError: checked }))}
                        />
                        <Label htmlFor="notify-new-error">Error baru</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="notify-resolved-error"
                          checked={settings.notifyOnResolvedError}
                          onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, notifyOnResolvedError: checked }))}
                        />
                        <Label htmlFor="notify-resolved-error">Error yang diselesaikan</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-base">Level Error Minimal</Label>
                    
                    <RadioGroup 
                      value={settings.minimumErrorLevel}
                      onValueChange={(value: string) => setSettings(prev => ({ 
                        ...prev, 
                        minimumErrorLevel: value as 'info' | 'warning' | 'error' | 'fatal' 
                      }))}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="info" id="error-level-info" />
                        <Label htmlFor="error-level-info">Info</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="warning" id="error-level-warning" />
                        <Label htmlFor="error-level-warning">Warning</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="error" id="error-level-error" />
                        <Label htmlFor="error-level-error">Error</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fatal" id="error-level-fatal" />
                        <Label htmlFor="error-level-fatal">Fatal</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 