"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiCheck, FiZap, FiStar } from 'react-icons/fi';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  price: number | null;
  features: Record<string, unknown>;
  highlight?: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Plan[]>("/plans")
      .then(data => {
        // Tandai paket Pro sebagai highlight jika ada
        const plansWithHighlight = data.map((plan: Plan) => ({
          ...plan,
          highlight: plan.name.toLowerCase() === "pro"
        }));
        setPlans(plansWithHighlight);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background py-16 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4 text-center">Pilih Paket yang Sesuai Kebutuhan Anda</h1>
      <p className="text-muted-foreground mb-12 text-center max-w-2xl">
        Mulai gratis, upgrade kapan saja. Semua paket sudah termasuk monitoring error real-time, dashboard modern, dan integrasi mudah ke aplikasi Anda.
      </p>
      {loading ? (
        <div className="text-center py-12">Memuat paket...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col border-2 ${plan.highlight ? 'border-primary shadow-xl scale-105 z-10' : 'border-border'} transition-all duration-200`}
            >
              <CardHeader className="flex flex-col items-center pb-0">
                <CardTitle className="text-2xl flex items-center gap-2">
                  {plan.name}
                  {plan.highlight && <FiStar className="text-primary" />}
                </CardTitle>
                <div className="text-4xl font-bold mt-4 mb-2">
                  {plan.price === 0 && 'Rp0'}
                  {plan.price === null && <span>Custom</span>}
                  {plan.price && plan.price > 0 && `Rp${plan.price.toLocaleString('id-ID')}`}
                </div>
                {plan.price && plan.price > 0 && <div className="text-xs mb-2 text-muted-foreground">/bulan</div>}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center">
                <ul className="mb-6 mt-2 space-y-3 text-sm w-full">
                  {Object.entries(plan.features).map(([key, value]) => (
                    <li key={key} className="flex items-center gap-2 text-foreground">
                      <FiCheck className="text-primary" />
                      <span className="capitalize">{typeof value === 'boolean' ? (value ? 'Tersedia' : 'Tidak tersedia') : value}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  className={`w-full mt-auto ${plan.highlight ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
                >
                  <Link href={plan.price === 0 ? "/register" : plan.name.toLowerCase() === "enterprise" ? "mailto:sales@lograven.com" : "/account/plan"} target={plan.name.toLowerCase() === "enterprise" ? "_blank" : undefined}>
                    {plan.price === 0 ? "Mulai Gratis" : plan.name.toLowerCase() === "enterprise" ? "Hubungi Sales" : "Upgrade ke Pro"}
                  </Link>
                </Button>
                {plan.highlight && (
                  <div className="mt-4 text-xs text-primary font-semibold flex items-center gap-1">
                    <FiZap /> Paling Populer
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 