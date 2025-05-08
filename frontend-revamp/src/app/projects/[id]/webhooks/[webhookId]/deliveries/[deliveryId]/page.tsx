'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WebhooksAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils/date';
import { FiArrowLeft, FiRefreshCw, FiCheckCircle, FiXCircle } from 'react-icons/fi';
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

interface WebhookDeliveryDetail {
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
  webhook: {
    id: string;
    url: string;
    enabled: boolean;
    eventType: string | null;
    secret: string | null;
    createdAt: string;
  };
}

export default function WebhookDeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.deliveryId as string;
  const webhookId = params.webhookId as string;
  const projectId = params.id as string;
  
  const [delivery, setDelivery] = useState<WebhookDeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetchDeliveryDetail();
  }, []);

  const fetchDeliveryDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await WebhooksAPI.getWebhookDeliveryDetail(deliveryId);
      setDelivery(result);
    } catch (err) {
      console.error('Error fetching webhook delivery detail:', err);
      setError('Gagal mengambil detail log webhook. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const result = await WebhooksAPI.retryWebhookDelivery(deliveryId);
      
      if (result.success) {
        toast.success('Webhook berhasil dikirim ulang');
      } else {
        toast.error(`Gagal mengirim ulang: ${result.error}`);
      }
    } catch (err) {
      console.error('Error retrying webhook:', err);
      toast.error('Gagal mengirim ulang webhook. Silakan coba lagi.');
    } finally {
      setRetrying(false);
    }
  };

  // Format JSON untuk tampilan
  const formatJSON = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href={`/projects/${projectId}/webhooks/${webhookId}/deliveries`}>
            <Button variant="outline" size="sm" className="mr-4">
              <FiArrowLeft className="mr-2" /> Kembali ke Daftar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Detail Pengiriman Webhook</h1>
          
          {delivery && !loading && (
            <Button 
              variant="outline" 
              size="sm"
              className="ml-auto"
              onClick={handleRetry}
              disabled={retrying}
            >
              <FiRefreshCw className={`mr-2 ${retrying ? 'animate-spin' : ''}`} /> 
              {retrying ? 'Mengirim...' : 'Kirim Ulang'}
            </Button>
          )}
        </div>
        
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
        ) : delivery ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Informasi Pengiriman</CardTitle>
                  {delivery.success ? (
                    <CustomBadge variant="success" className="flex items-center">
                      <FiCheckCircle className="mr-1" /> Berhasil
                    </CustomBadge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center">
                      <FiXCircle className="mr-1" /> Gagal
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  ID: {delivery.id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Webhook URL</div>
                    <div className="text-sm text-muted-foreground truncate">{delivery.webhook.url}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Status HTTP</div>
                    <div className="text-sm">
                      {delivery.statusCode ? (
                        <Badge variant="outline">
                          {delivery.statusCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Waktu Kirim</div>
                    <div className="text-sm text-muted-foreground">{formatDate(delivery.sentAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Waktu Response</div>
                    <div className="text-sm text-muted-foreground">
                      {delivery.responseAt ? formatDate(delivery.responseAt) : '-'}
                    </div>
                  </div>
                  {delivery.error && (
                    <div className="col-span-2">
                      <div className="text-sm font-medium mb-1">Error</div>
                      <div className="text-sm text-destructive">{delivery.error}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs max-h-[400px]">
                    {formatJSON(delivery.requestBody)}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Response</CardTitle>
                </CardHeader>
                <CardContent>
                  {delivery.responseBody ? (
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-xs max-h-[400px]">
                      {formatJSON(delivery.responseBody)}
                    </pre>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Tidak ada response
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">Log webhook tidak ditemukan</div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 