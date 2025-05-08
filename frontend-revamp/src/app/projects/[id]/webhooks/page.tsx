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
          <h1 className="text-2xl font-bold text-gray-800">Webhook</h1>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <FiPlus className="mr-2 h-4 w-4" />
              Tambah Webhook
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="webhook-url">
                    URL Webhook
                  </label>
                  <input
                    id="webhook-url"
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/webhook"
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="webhook-event-type">
                    Tipe Event
                  </label>
                  <select
                    id="webhook-event-type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    disabled={submitting}
                  >
                    <option value="all">Semua event</option>
                    <option value="error">Error saja</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="webhook-secret">
                    Secret (opsional)
                  </label>
                  <input
                    id="webhook-secret"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    placeholder="Secret untuk validasi webhook"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Secret akan digunakan untuk membuat signature HMAC SHA-256 dari payload.
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="webhook-enabled"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    disabled={submitting}
                  />
                  <label htmlFor="webhook-enabled" className="ml-2 block text-sm text-gray-700">
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
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
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
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Memuat webhook...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-50 mb-4">
              <FiLink className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-medium text-lg mb-2">Belum ada webhook</h3>
            <p className="text-gray-500 mb-4">Tambahkan webhook untuk mengirim notifikasi error ke sistem eksternal.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <FiPlus className="mr-2 h-4 w-4" />
              Tambah Webhook
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="p-6 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-lg break-all">{webhook.url}</h3>
                      <Badge variant={webhook.enabled ? "default" : "secondary"}>
                        {webhook.enabled ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      Tipe: {webhook.eventType || 'all'} • Dibuat: {formatDate(webhook.createdAt)}
                    </div>
                    {webhook.secret && (
                      <div className="text-xs text-gray-500">
                        Menggunakan secret: Ya
                      </div>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2 p-4 bg-gray-50 sm:justify-center">
                    <Button 
                      size="sm" 
                      variant={webhook.enabled ? "outline" : "default"}
                      onClick={() => toggleWebhookStatus(webhook.id, webhook.enabled)}
                    >
                      {webhook.enabled ? (
                        <>
                          <FiX className="mr-1 h-4 w-4" />
                          Nonaktifkan
                        </>
                      ) : (
                        <>
                          <FiCheck className="mr-1 h-4 w-4" />
                          Aktifkan
                        </>
                      )}
                    </Button>
                    <Link href={`/projects/${projectId}/webhooks/${webhook.id}/deliveries`}>
                      <Button variant="outline" size="sm">
                        Lihat Log
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <FiTrash2 className="mr-1 h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 