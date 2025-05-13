'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { NotificationAPI } from '@/lib/api';
import { 
  FiSend, 
  FiMail, 
  FiSlack, 
  FiAlertCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiXCircle,
  FiCheckCircle,
  FiSettings,
  FiMessageSquare,
  FiUser,
  FiUsers,
  FiLink,
  FiHash
} from 'react-icons/fi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationSettings {
  email: boolean;
  slack: boolean;
  slackWebhookUrl?: string;
  slackChannel?: string;
  slackUsername?: string;
  slackEmoji?: string;
  whatsapp: boolean;
  whatsappNumber?: string;
  whatsappVerified: boolean;
  notifyOnNewError: boolean;
  notifyOnResolvedError: boolean;
  minimumErrorLevel: 'info' | 'warning' | 'error' | 'fatal';
}

export default function NotificationsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [settings, setSettings] = useState<NotificationSettings>({
    email: false,
    slack: false,
    slackWebhookUrl: '',
    slackChannel: '',
    slackUsername: 'LogRaven Bot',
    slackEmoji: ':robot:',
    whatsapp: false,
    whatsappNumber: '',
    whatsappVerified: false,
    notifyOnNewError: true,
    notifyOnResolvedError: false,
    minimumErrorLevel: 'error'
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false);
  const [isVerifyingWhatsapp, setIsVerifyingWhatsapp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('channels');
  const [verificationCode, setVerificationCode] = useState('');

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
        toast.error('Gagal memuat pengaturan notifikasi');
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
      
      toast.success('Pengaturan notifikasi berhasil disimpan');
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Gagal menyimpan pengaturan notifikasi. Silakan coba lagi.');
      toast.error('Gagal menyimpan pengaturan notifikasi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async (type: 'email' | 'slack' | 'whatsapp') => {
    try {
      if (type === 'email') {
        setIsTestingEmail(true);
      } else if (type === 'slack') {
        setIsTestingSlack(true);
      } else {
        setIsTestingWhatsapp(true);
      }
      
      setError(null);
      
      await NotificationAPI.testNotification(projectId, type);
      
      toast.success(`Notifikasi ${type === 'email' ? 'email' : type === 'slack' ? 'Slack' : 'WhatsApp'} tes berhasil dikirim`);
    } catch (err) {
      console.error(`Error testing ${type} notification:`, err);
      setError(`Gagal mengirim notifikasi ${type === 'email' ? 'email' : type === 'slack' ? 'Slack' : 'WhatsApp'} tes. Silakan coba lagi.`);
      toast.error(`Gagal mengirim notifikasi ${type === 'email' ? 'email' : type === 'slack' ? 'Slack' : 'WhatsApp'} tes`);
    } finally {
      if (type === 'email') {
        setIsTestingEmail(false);
      } else if (type === 'slack') {
        setIsTestingSlack(false);
      } else {
        setIsTestingWhatsapp(false);
      }
    }
  };

  const handleVerifyWhatsapp = async () => {
    try {
      setIsVerifyingWhatsapp(true);
      setError(null);
      
      // Simulasi pengiriman kode verifikasi ke WhatsApp
      await NotificationAPI.sendWhatsappVerificationCode(projectId, settings.whatsappNumber);
      
      toast.success('Kode verifikasi telah dikirim ke WhatsApp Anda');
    } catch (err) {
      console.error('Error sending WhatsApp verification code:', err);
      setError('Gagal mengirim kode verifikasi WhatsApp. Silakan coba lagi.');
      toast.error('Gagal mengirim kode verifikasi WhatsApp');
    } finally {
      setIsVerifyingWhatsapp(false);
    }
  };

  const handleSubmitVerificationCode = async () => {
    try {
      setIsVerifyingWhatsapp(true);
      setError(null);
      
      // Simulasi verifikasi kode
      const success = await NotificationAPI.verifyWhatsappCode(projectId, settings.whatsappNumber, verificationCode);
      
      if (success) {
        setSettings(prev => ({ ...prev, whatsappVerified: true }));
        toast.success('Nomor WhatsApp berhasil diverifikasi');
        setVerificationCode('');
      } else {
        toast.error('Kode verifikasi tidak valid. Silakan coba lagi');
      }
    } catch (err) {
      console.error('Error verifying WhatsApp code:', err);
      setError('Gagal memverifikasi kode WhatsApp. Silakan coba lagi.');
      toast.error('Gagal memverifikasi kode WhatsApp');
    } finally {
      setIsVerifyingWhatsapp(false);
    }
  };

  // Memvisualisasikan level error
  const getErrorLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case 'fatal':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Fatal</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Pengaturan Notifikasi</h1>
            <p className="text-muted-foreground mt-1">
              Konfigurasikan cara menerima pemberitahuan tentang error di aplikasi Anda
            </p>
          </div>
          
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving || loading}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <FiCheckCircle className="h-4 w-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <FiAlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium">Memuat pengaturan notifikasi...</p>
            <p className="text-muted-foreground mt-1">Mohon tunggu sebentar</p>
          </div>
        ) : (
          <Tabs defaultValue="channels" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger value="channels" className="flex items-center gap-2">
                <FiMail className="h-4 w-4" />
                <span>Saluran Notifikasi</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <FiSettings className="h-4 w-4" />
                <span>Pengaturan Lanjutan</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="channels" className="space-y-6">
              {/* Email Notifications */}
              <Card className="overflow-hidden border-l-4 border-l-blue-500">
                <CardHeader className='bg-secondary'>
                  <div className="flex items-center">
                    <div className="p-2 rounded-full mr-4">
                      <FiMail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Notifikasi Email</CardTitle>
                      <CardDescription>
                        Terima pemberitahuan error via email
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="email-notifications" className="text-base font-medium">
                        Aktifkan Notifikasi Email
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Email akan dikirim ke alamat email yang terdaftar di akun Anda
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={settings.email}
                      onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, email: checked }))}
                    />
                  </div>
                </CardContent>
                {settings.email && (
                  <CardFooter className="bg-blue-50/30 border-t flex justify-end py-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestNotification('email')}
                      disabled={isTestingEmail}
                      className="gap-2"
                    >
                      {isTestingEmail ? (
                        <>
                          <div className="h-3 w-3 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <FiSend className="h-3 w-3" />
                          <span>Kirim Email Tes</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
              
              {/* Slack Notifications */}
              <Card className="overflow-hidden border-l-4 border-l-purple-500">
                <CardHeader className='bg-secondary'>
                  <div className="flex items-center">
                    <div className="p-2 rounded-full mr-4">
                      <FiSlack className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Notifikasi Slack</CardTitle>
                      <CardDescription>
                        Terima pemberitahuan error di channel Slack Anda
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="slack-notifications" className="text-base font-medium">
                        Aktifkan Notifikasi Slack
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Terima notifikasi langsung di channel Slack pilihan Anda
                      </p>
                    </div>
                    <Switch 
                      id="slack-notifications" 
                      checked={settings.slack}
                      onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, slack: checked }))}
                    />
                  </div>
                  
                  {settings.slack && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label htmlFor="slack-webhook" className="text-sm font-medium mb-2 block">
                          Slack Webhook URL <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="slack-webhook"
                          value={settings.slackWebhookUrl || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                          placeholder="https://hooks.slack.com/services/xxx/yyy/zzz"
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-2 flex items-center">
                          <FiInfo className="mr-1 h-3 w-3" />
                          Dapatkan webhook URL dari Slack Apps &gt; Incoming Webhooks
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="slack-channel" className="text-sm font-medium mb-2 block">
                          Channel Slack
                        </Label>
                        <div className="flex items-center">
                          <div className="mr-2">
                            <FiHash className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            id="slack-channel"
                            value={settings.slackChannel || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, slackChannel: e.target.value }))}
                            placeholder="errors-monitoring"
                            className="text-sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 ml-6">
                          Kosongkan untuk menggunakan channel default di webhook
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="slack-username" className="text-sm font-medium mb-2 block">
                            Nama Bot
                          </Label>
                          <div className="flex items-center">
                            <div className="mr-2">
                              <FiUser className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Input 
                              id="slack-username"
                              value={settings.slackUsername || ''}
                              onChange={(e) => setSettings(prev => ({ ...prev, slackUsername: e.target.value }))}
                              placeholder="LogRaven Bot"
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="slack-emoji" className="text-sm font-medium mb-2 block">
                            Emoji Bot
                          </Label>
                          <Input 
                            id="slack-emoji"
                            value={settings.slackEmoji || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, slackEmoji: e.target.value }))}
                            placeholder=":robot:"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                {settings.slack && (
                  <CardFooter className="bg-purple-50/30 border-t flex justify-end py-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestNotification('slack')}
                      disabled={isTestingSlack || !settings.slackWebhookUrl}
                      className="gap-2"
                    >
                      {isTestingSlack ? (
                        <>
                          <div className="h-3 w-3 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <FiSend className="h-3 w-3" />
                          <span>Kirim Slack Tes</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* WhatsApp Notifications */}
              <Card className="overflow-hidden border-l-4 border-l-green-500">
                <CardHeader className='bg-secondary'>
                  <div className="flex items-center">
                    <div className="p-2 rounded-full mr-4">
                      <FiMessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Notifikasi WhatsApp</CardTitle>
                      <CardDescription>
                        Terima pemberitahuan error di WhatsApp Anda
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="whatsapp-notifications" className="text-base font-medium">
                        Aktifkan Notifikasi WhatsApp
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Terima notifikasi langsung ke nomor WhatsApp Anda
                      </p>
                    </div>
                    <Switch 
                      id="whatsapp-notifications" 
                      checked={settings.whatsapp}
                      onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, whatsapp: checked }))}
                    />
                  </div>
                  
                  {settings.whatsapp && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label htmlFor="whatsapp-number" className="text-sm font-medium mb-2 flex items-center justify-between">
                          <span>Nomor WhatsApp <span className="text-red-500">*</span></span>
                          {settings.whatsappVerified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Terverifikasi
                            </Badge>
                          )}
                        </Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="whatsapp-number"
                            value={settings.whatsappNumber || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value, whatsappVerified: false }))}
                            placeholder="+628123456789"
                            className="text-sm"
                            disabled={settings.whatsappVerified}
                          />
                          {!settings.whatsappVerified && (
                            <Button 
                              variant="outline" 
                              type="button" 
                              onClick={handleVerifyWhatsapp}
                              disabled={isVerifyingWhatsapp || !settings.whatsappNumber}
                            >
                              {isVerifyingWhatsapp ? 'Mengirim...' : 'Verifikasi'}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center">
                          <FiInfo className="mr-1 h-3 w-3" />
                          Nomor WhatsApp harus dalam format internasional (dengan +62)
                        </p>
                      </div>

                      {!settings.whatsappVerified && settings.whatsappNumber && (
                        <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mt-4">
                          <h4 className="text-sm font-medium text-amber-800 mb-2">Verifikasi Nomor WhatsApp</h4>
                          <p className="text-xs text-amber-700 mb-3">
                            Kami perlu memverifikasi nomor WhatsApp Anda untuk mengirim notifikasi. Klik tombol Verifikasi 
                            untuk menerima kode verifikasi di WhatsApp Anda.
                          </p>
                          
                          {verificationCode !== '' && (
                            <div className="space-y-3">
                              <Label htmlFor="verification-code" className="text-xs font-medium text-amber-800">
                                Masukkan Kode Verifikasi
                              </Label>
                              <div className="flex space-x-2">
                                <Input 
                                  id="verification-code"
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value)}
                                  placeholder="123456"
                                  className="text-sm"
                                  autoComplete="off"
                                />
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={handleSubmitVerificationCode}
                                  disabled={isVerifyingWhatsapp || !verificationCode}
                                >
                                  {isVerifyingWhatsapp ? 'Memverifikasi...' : 'Kirim'}
                                </Button>
                              </div>
                              <p className="text-xs text-amber-700">
                                Kode tidak diterima? <button 
                                  type="button" 
                                  className="text-amber-800 underline"
                                  onClick={handleVerifyWhatsapp}
                                  disabled={isVerifyingWhatsapp}
                                >
                                  Kirim ulang kode
                                </button>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                {settings.whatsapp && settings.whatsappVerified && (
                  <CardFooter className="bg-green-50/30 border-t flex justify-end py-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestNotification('whatsapp')}
                      disabled={isTestingWhatsapp || !settings.whatsappVerified}
                      className="gap-2"
                    >
                      {isTestingWhatsapp ? (
                        <>
                          <div className="h-3 w-3 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <FiSend className="h-3 w-3" />
                          <span>Kirim WhatsApp Tes</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              {/* Notification Triggers */}
              <Card>
                <CardHeader>
                  <CardTitle>Pemicu Notifikasi</CardTitle>
                  <CardDescription>
                    Tentukan kapan Anda ingin menerima notifikasi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">NOTIFIKASI UNTUK</h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-start space-x-4">
                        <Switch 
                          id="notify-new-error"
                          checked={settings.notifyOnNewError}
                          onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, notifyOnNewError: checked }))}
                        />
                        <div>
                          <Label htmlFor="notify-new-error" className="font-medium">Error baru</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Menerima notifikasi saat error baru terdeteksi di aplikasi Anda
                          </p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-start space-x-4">
                        <Switch 
                          id="notify-resolved-error"
                          checked={settings.notifyOnResolvedError}
                          onCheckedChange={(checked: boolean) => setSettings(prev => ({ ...prev, notifyOnResolvedError: checked }))}
                        />
                        <div>
                          <Label htmlFor="notify-resolved-error" className="font-medium">Error yang diselesaikan</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Menerima notifikasi saat error ditandai sebagai selesai atau teratasi
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Error Level Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Level Keparahan</CardTitle>
                  <CardDescription>
                    Atur level minimal error yang akan mengirimkan notifikasi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">LEVEL ERROR MINIMAL</h3>
                    
                    <div>
                      <p className="text-sm mb-2">
                        Saat ini: {getErrorLevelBadge(settings.minimumErrorLevel)}
                      </p>
                      
                      <RadioGroup 
                        value={settings.minimumErrorLevel}
                        onValueChange={(value: string) => setSettings(prev => ({ 
                          ...prev, 
                          minimumErrorLevel: value as 'info' | 'warning' | 'error' | 'fatal' 
                        }))}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/20 transition-colors">
                          <RadioGroupItem value="info" id="error-level-info" />
                          <div className="flex items-center space-x-2">
                            <FiInfo className="h-4 w-4 text-blue-500" />
                            <Label htmlFor="error-level-info" className="font-medium">Info</Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4">
                            Semua log informasi dan level yang lebih tinggi
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/20 transition-colors">
                          <RadioGroupItem value="warning" id="error-level-warning" />
                          <div className="flex items-center space-x-2">
                            <FiAlertTriangle className="h-4 w-4 text-amber-500" />
                            <Label htmlFor="error-level-warning" className="font-medium">Warning</Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4">
                            Semua peringatan dan level yang lebih tinggi
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/20 transition-colors">
                          <RadioGroupItem value="error" id="error-level-error" />
                          <div className="flex items-center space-x-2">
                            <FiAlertCircle className="h-4 w-4 text-red-500" />
                            <Label htmlFor="error-level-error" className="font-medium">Error</Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4">
                            Semua error dan level yang lebih tinggi (Direkomendasikan)
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-2 rounded hover:bg-accent/20 transition-colors">
                          <RadioGroupItem value="fatal" id="error-level-fatal" />
                          <div className="flex items-center space-x-2">
                            <FiXCircle className="h-4 w-4 text-red-700" />
                            <Label htmlFor="error-level-fatal" className="font-medium">Fatal</Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4">
                            Hanya error fatal yang menyebabkan aplikasi crash
                          </p>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
} 