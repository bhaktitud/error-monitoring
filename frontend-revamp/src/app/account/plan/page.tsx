"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthAPI, UserProfile } from "@/lib/api";
import { toast } from "sonner";
import { FiCheck, FiX, FiUsers, FiDatabase, FiClock, FiMail, FiZap } from 'react-icons/fi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

export default function PlanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await AuthAPI.getCurrentUser();
        setProfile(userData);
        const res = await fetch(`${API_BASE_URL}/plans`);
        const planData = await res.json();
        setPlans(planData);
      } catch (err) {
        toast.error("Gagal memuat data plan atau profil");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!profile) return;
    const selected = plans.find((p) => p.id === planId);
    if (selected && selected.price && selected.price > 0) {
      // Redirect ke halaman pembayaran
      router.push(`/account/plan/payment?planId=${planId}`);
      return;
    }
    setUpdating(planId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`${API_BASE_URL}/plans/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: profile.id, planId })
      });
      if (!res.ok) throw new Error('Gagal mengubah plan');
      toast.success('Plan berhasil diubah!');
      // Refresh profile
      const userData = await AuthAPI.getCurrentUser();
      setProfile(userData);
    } catch {
      toast.error('Gagal mengubah plan');
    } finally {
      setUpdating(null);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pilih Paket Berlangganan</h1>
        <Button variant="outline" onClick={() => router.push('/account/profile')}>Kembali ke Profil</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className={`flex flex-col border ${plan.name === profile.plan?.name ? 'border-primary' : 'border-border'} p-6 min-w-64`}>
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{plan.price === 0 ? 'Rp0' : plan.price === null ? 'Custom' : `Rp${plan.price.toLocaleString()}`}</div>
              {<div className="text-xs mb-2 text-muted-foreground">/bulan</div>}
              <ul className="mb-4 text-sm text-muted-foreground space-y-2">
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
            </CardContent>
            <CardFooter>
              <Button
                size="sm"
                className="w-full"
                disabled={updating === plan.id || plan.name === profile.plan?.name}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {updating === plan.id ? 'Memproses...' : plan.name === profile.plan?.name ? 'Paket Aktif' : 'Pilih Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 