'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiArrowLeft, FiCopy } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SdkSetupPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  // Dummy DSN, seharusnya fetch dari store/API
  const dsn = `https://dsn.example.com/${projectId}`;

  const copyDSN = () => {
    navigator.clipboard.writeText(dsn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}`)} className="mr-4">
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Panduan Integrasi SDK</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Langkah Integrasi</h2>
            <ol className="list-decimal pl-6 space-y-2 mb-6">
              <li>Install SDK pada aplikasi Anda.</li>
              <li>Masukkan DSN berikut ke konfigurasi SDK:</li>
            </ol>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-muted p-3 rounded font-mono text-sm border">{dsn}</div>
              <Button variant="outline" size="sm" onClick={copyDSN}>
                <FiCopy className="mr-1 h-4 w-4" />
                {copied ? 'Disalin!' : 'Salin'}
              </Button>
            </div>
            <div className="mb-4">
              <h3 className="font-medium mb-2">Contoh Kode Integrasi</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { init } from '@yourorg/sdk';

init({
  dsn: '${dsn}',
  // opsi lain
});`}
              </pre>
            </div>
            <p className="text-muted-foreground text-sm">
              Untuk dokumentasi lebih lengkap, silakan kunjungi <a href="#" className="underline">docs</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 