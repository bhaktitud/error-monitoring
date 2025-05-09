'use client'
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiPlus, FiTrash2, FiLink, FiCheck, FiX } from 'react-icons/fi';
import { WebhooksAPI } from '@/lib/api';
import Link from 'next/link';

interface Webhook {
  id: string;
  url: string;
  enabled: boolean;
  eventType: string | null;
  secret: string | null;
  createdAt: string;
}

export default function WebhooksPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    enabled: true,
    eventType: 'all',
    secret: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebhooks = async () => {
      try {
        setLoading(true);
        const data = await WebhooksAPI.getWebhooks(projectId);
        setWebhooks(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching webhooks:', err);
        setError('Gagal memuat webhook. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchWebhooks();
    }
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const webhookData = {
        url: formData.url,
        enabled: formData.enabled,
        eventType: formData.eventType,
        secret: formData.secret,
      };
      
      const newWebhook = await WebhooksAPI.createWebhook(projectId, webhookData);
      
      setWebhooks(prev => [...prev, newWebhook]);
      setFormData({
        url: '',
        enabled: true,
        eventType: 'all',
        secret: '',
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error creating webhook:', err);
      setError('Gagal menambahkan webhook. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWebhookStatus = async (id: string, currentStatus: boolean) => {
    try {
      const webhookToUpdate = webhooks.find(wh => wh.id === id);
      if (!webhookToUpdate) return;
      
      const updatedData = {
        url: webhookToUpdate.url,
        enabled: !currentStatus,
        eventType: webhookToUpdate.eventType || 'all',
        secret: webhookToUpdate.secret || '',
      };
      
      await WebhooksAPI.updateWebhook(id, updatedData);
      
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === id ? { ...webhook, enabled: !currentStatus } : webhook
        )
      );
    } catch (err) {
      console.error('Error toggling webhook status:', err);
      setError('Gagal mengubah status webhook. Silakan coba lagi.');
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Anda yakin ingin menghapus webhook ini?')) return;
    
    try {
      await WebhooksAPI.deleteWebhook(id);
      setWebhooks(prev => prev.filter(webhook => webhook.id !== id));
    } catch (err) {
      console.error('Error deleting webhook:', err);
      setError('Gagal menghapus webhook. Silakan coba lagi.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Webhook</h1>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <FiPlus className="mr-2 h-4 w-4" />
              Tambah Webhook
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showAddForm && (
          <Card className="mb-6">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Tambah Webhook Baru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1" htmlFor="webhook-url">
                    URL Webhook
                  </label>
                  <input
                    id="webhook-url"
                    type="url"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/webhook"
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1" htmlFor="webhook-event-type">
                    Tipe Event
                  </label>
                  <select
                    id="webhook-event-type"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    disabled={submitting}
                  >
                    <option value="all">Semua event</option>
                    <option value="error">Error saja</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1" htmlFor="webhook-secret">
                    Secret (opsional)
                  </label>
                  <input
                    id="webhook-secret"
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    placeholder="Secret untuk validasi webhook"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Secret akan digunakan untuk membuat signature HMAC SHA-256 dari payload.
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="webhook-enabled"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    disabled={submitting}
                  />
                  <label htmlFor="webhook-enabled" className="ml-2 block text-sm text-foreground">
                    Aktifkan webhook
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  disabled={!formData.url.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="text-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Memuat webhook...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-lg border border-dashed border-border">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/20 mb-4">
              <FiLink className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-lg mb-2">Belum ada Webhook</h3>
            <p className="text-muted-foreground mb-4">Tambahkan webhook untuk mengirim notifikasi error ke sistem eksternal.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <FiPlus className="mr-2 h-4 w-4" />
              Tambah Webhook
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        URL Webhook:
                      </div>
                      <Link href={webhook.url} className="break-all" target="_blank">
                        <div className="text-xs text-muted-foreground">
                          {webhook.url}
                        </div>
                      </Link>
                    </div>
                    <div className="flex sm:flex-col gap-2 p-4 bg-muted sm:justify-center">
                      <div className="flex items-center justify-between w-full">
                        <div>Status:</div>
                        <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                          {webhook.enabled ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <div>Event:</div>
                        <Badge variant="outline">
                          {webhook.eventType === 'error' ? 'Error saja' : 'Semua event'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <div>Dibuat:</div>
                        <span className="text-sm">{formatDate(webhook.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button
                      variant={webhook.enabled ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => toggleWebhookStatus(webhook.id, webhook.enabled)}
                    >
                      {webhook.enabled ? (
                        <>
                          <FiX className="mr-1 h-4 w-4" /> Nonaktifkan
                        </>
                      ) : (
                        <>
                          <FiCheck className="mr-1 h-4 w-4" /> Aktifkan
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <FiTrash2 className="mr-1 h-4 w-4" /> Hapus
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => 
                        window.location.href = `/projects/${projectId}/webhooks/${webhook.id}/deliveries`
                      }
                    >
                      Lihat Kiriman
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 