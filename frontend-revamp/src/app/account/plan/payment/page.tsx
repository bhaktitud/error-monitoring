"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthAPI } from "@/lib/api";
import { toast } from "sonner";
import { FiCheck, FiX, FiUsers, FiDatabase, FiClock, FiMail, FiZap } from 'react-icons/fi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper untuk label fitur
const featureLabel = (key: string) => {
  switch (key) {
    case 'teamMembers': return 'Team Members';
    case 'projects': return 'Projects';
    case 'retentionDays': return 'Retention (days)';
    case 'eventsPerMonth': return 'Events per Month';
    case 'alert': return 'Alert';
    case 'webhook': return 'Webhook';
    case 'prioritySupport': return 'Priority Support';
    case 'sso': return 'SSO';
    case 'sla': return 'SLA';
    case 'onboarding': return 'Onboarding';
    case 'allProFeatures': return 'All Pro Features';
    default: return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
};

// Helper untuk icon fitur
const featureIcon = (key: string, value: any) => {
  switch (key) {
    case 'teamMembers': return <FiUsers className="inline mr-1" />;
    case 'projects': return <FiDatabase className="inline mr-1" />;
    case 'retentionDays': return <FiClock className="inline mr-1" />;
    case 'alert': return <FiMail className="inline mr-1" />;
    case 'prioritySupport': return <FiZap className="inline mr-1" />;
    default: return value === true ? <FiCheck className="inline mr-1 text-success" /> : value === false ? <FiX className="inline mr-1 text-destructive" /> : null;
  }
};

export default function PlanPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/plans/${planId}`)
      .then(res => res.json())
      .then(data => setPlan(data))
      .catch(() => toast.error('Gagal memuat data plan'))
      .finally(() => setLoading(false));
  }, [planId]);

  const handlePay = async () => {
    if (!planId) return;
    setPaying(true);
    // Simulasi: langsung update plan user (nanti diganti dengan payment gateway)
    try {
      const user = await AuthAPI.getCurrentUser();
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`${API_BASE_URL}/plans/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, planId })
      });
      if (!res.ok) throw new Error('Gagal update plan');
      toast.success('Pembayaran berhasil! Plan Anda sudah diupdate.');
      router.push('/account/plan');
    } catch {
      toast.error('Gagal update plan');
    } finally {
      setPaying(false);
    }
  };

  if (loading || !plan) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pembayaran Paket</h1>
        <Button variant="outline" onClick={() => router.push('/account/plan')}>Kembali</Button>
      </div>
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{plan.price === 0 ? 'Rp0' : plan.price === null ? 'Custom' : `Rp${plan.price.toLocaleString()}`}</div>
            {plan.price && plan.price > 0 && <div className="text-xs mb-2 text-muted-foreground">/bulan</div>}
            <ul className="mb-6 text-sm text-muted-foreground space-y-2">
              {plan.features && Object.entries(plan.features).map(([key, value]) => (
                <li key={key} className="flex items-center gap-2">
                  {featureIcon(key, value)}
                  <span className="font-medium text-foreground">{featureLabel(key)}:</span>
                  <span className="ml-1">
                    {Array.isArray(value) ? value.join(', ') : (typeof value === 'boolean' ? (value ? 'Tersedia' : 'Tidak tersedia') : value)}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="w-full"
              disabled={paying}
              onClick={handlePay}
            >
              {paying ? 'Memproses...' : 'Bayar Sekarang'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 