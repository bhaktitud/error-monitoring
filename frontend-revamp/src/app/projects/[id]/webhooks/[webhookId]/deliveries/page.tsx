'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { WebhooksAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils/date';
import { FiArrowLeft, FiRefreshCw, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';
import Link from 'next/link';
import { toast } from 'sonner';

// Definisikan custom badge variants
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "success";
}

// Override Badge component dengan custom variant
const CustomBadge = ({ variant = "default", ...props }: BadgeProps) => {
  const getVariantClasses = () => {
    if (variant === "success") {
      return "bg-green-100 text-green-800 hover:bg-green-200";
    }
    return "";
  };

  return (
    <Badge 
      variant={variant === "success" ? "outline" : variant} 
      className={`${getVariantClasses()} ${props.className || ""}`}
      {...props} 
    />
  );
};

interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string | null;
  requestBody: string;
  responseBody: string | null;
  statusCode: number | null;
  success: boolean;
  error: string | null;
  sentAt: string;
  responseAt: string | null;
}

interface Webhook {
  id: string;
  url: string;
  enabled: boolean;
  eventType: string | null;
  secret: string | null;
  createdAt: string;
}

export default function WebhookDeliveriesPage() {
  const params = useParams();
  const router = useRouter();
  const webhookId = params.webhookId as string;
  const projectId = params.id as string;
  
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveries();
  }, [page]);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mendapatkan webhook detail dari list webhooks
      const webhooks = await WebhooksAPI.getWebhooks(projectId);
      const currentWebhook = webhooks.find(w => w.id === webhookId);
      
      if (!currentWebhook) {
        setError('Webhook tidak ditemukan');
        setLoading(false);
        return;
      }
      
      setWebhook(currentWebhook);
      
      // Mendapatkan log delivery
      const result = await WebhooksAPI.getWebhookDeliveries(webhookId, page);
      setDeliveries(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching webhook deliveries:', err);
      setError('Gagal mengambil data log webhook. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (deliveryId: string) => {
    setRetrying(deliveryId);
    try {
      const result = await WebhooksAPI.retryWebhookDelivery(deliveryId);
      
      if (result.success) {
        toast.success('Webhook berhasil dikirim ulang');
        // Refresh data
        fetchDeliveries();
      } else {
        toast.error(`Gagal mengirim ulang: ${result.error}`);
      }
    } catch (err) {
      console.error('Error retrying webhook:', err);
      toast.error('Gagal mengirim ulang webhook. Silakan coba lagi.');
    } finally {
      setRetrying(null);
    }
  };

  const handleViewDetail = (deliveryId: string) => {
    router.push(`/projects/${projectId}/webhooks/${webhookId}/deliveries/${deliveryId}`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href={`/projects/${projectId}/webhooks`}>
            <Button variant="outline" size="sm" className="mr-4">
              <FiArrowLeft className="mr-2" /> Kembali
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Log Pengiriman Webhook</h1>
        </div>
        
        {webhook && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informasi Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">URL</div>
                  <div className="text-sm text-muted-foreground truncate">{webhook.url}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Status</div>
                  <CustomBadge variant={webhook.enabled ? "success" : "destructive"}>
                    {webhook.enabled ? 'Aktif' : 'Nonaktif'}
                  </CustomBadge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {error ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-destructive">{error}</div>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">Memuat data...</div>
            </CardContent>
          </Card>
        ) : deliveries.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">Belum ada log pengiriman webhook</div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Waktu</th>
                        <th className="text-left p-4 font-medium">Response</th>
                        <th className="text-left p-4 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((delivery) => (
                        <tr key={delivery.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            {delivery.success ? (
                              <CustomBadge variant="success" className="flex items-center">
                                <FiCheckCircle className="mr-1" /> Berhasil
                              </CustomBadge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center">
                                <FiXCircle className="mr-1" /> Gagal
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-sm">
                            <div>{formatDate(delivery.sentAt)}</div>
                            {delivery.statusCode && (
                              <Badge variant="outline" className="mt-1">
                                {delivery.statusCode}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-sm max-w-[300px] truncate">
                            {delivery.error ? (
                              <span className="text-destructive">{delivery.error}</span>
                            ) : delivery.responseBody ? (
                              <span className="text-muted-foreground">{delivery.responseBody}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetail(delivery.id)}
                              >
                                <FiEye className="mr-1" /> Detail
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRetry(delivery.id)}
                                disabled={retrying === delivery.id}
                              >
                                <FiRefreshCw className={`mr-1 ${retrying === delivery.id ? 'animate-spin' : ''}`} /> 
                                {retrying === delivery.id ? 'Mengirim...' : 'Kirim Ulang'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination 
                  currentPage={page} 
                  totalPages={totalPages}
                  onPageChange={setPage} 
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 