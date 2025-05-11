"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiCheck, FiZap, FiStar, FiSettings, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  price: number | null;
  features: Record<string, unknown>;
  highlight?: boolean;
}

  // Tambahkan fungsi utilitas untuk label fitur
  const featureLabel = (key: string) => {
    switch (key.toLowerCase()) {
      case 'email': return 'Notifikasi Email';
      case 'slack': return 'Integrasi Slack';
      case 'webhook': return 'Integrasi Webhook';
      case 'support': return 'Support Prioritas';
      case 'unlimited': return 'Unlimited';
      case 'project': return 'Jumlah Project';
      case 'events': return 'Event per Bulan';
      case 'emailslackwebhook': return 'Email, Slack & Webhook';
      case 'custom': return 'Kustomisasi';
      default:
        // Pisahkan camelCase/underscore dan kapitalisasi
        return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
            key={plan.id}
            className={
              (plan.name === 'Pro'
                ? 'border-2 border-primary bg-primary/10 scale-105 z-10 '
                : 'border border-border bg-card hover:border-primary/70 hover:bg-card/80 ') +
              'flex flex-col rounded-xl p-8 shadow-sm items-center h-full min-h-[480px] transition-all duration-300 hover:shadow-xl hover:translate-y-[-8px] group cursor-pointer'
            }
            style={{
              transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease"
            }}
          >
            <h3 className="text-xl font-semibold mb-2 text-primary group-hover:scale-105 transition-transform">{plan.name}</h3>
            <div className={`text-3xl font-bold mb-2 ${plan.name === 'Pro' ? 'text-primary' : ''} group-hover:text-primary group-hover:scale-110 transition-all duration-300`}>
              {plan.price === 0 ? 'Rp0' : plan.price === null ? 'Custom' : `Rp${plan.price.toLocaleString()}`}
            </div>
            <div className={`text-xs mb-4 ${plan.name === 'Pro' ? 'text-primary/80' : 'text-muted-foreground'} group-hover:opacity-80`}>
              {plan.price && plan.price > 0 ? '/bulan' : plan.name === 'Enterprise' ? 'Hubungi Kami' : '/bulan'}
            </div>
            <ul className={`mb-6 ${plan.name === 'Pro' ? 'text-primary' : 'text-muted-foreground'} text-sm flex-1 space-y-2 text-left w-full`}>
              {plan.features && Object.entries(plan.features).map(([key, valueRaw], index) => {
                const value = valueRaw as string | number | boolean;
                let icon = null;
                if (typeof value === 'boolean') {
                  icon = value ? <FiCheck className="text-green-500" /> : <FiX className="text-destructive" />;
                } else if (typeof value === 'number') {
                  icon = <FiCheck className="text-green-500" />;
                } else if (value === 'unlimited') {
                  icon = <FiZap className="text-yellow-500" />;
                } else if (value === 'custom') {
                  icon = <FiSettings className="text-blue-500" />;
                } else if (typeof value === 'string' && value.trim() !== '') {
                  icon = <FiCheck className="text-green-500" />;
                } else {
                  icon = <FiX className="text-destructive" />;
                }
                return (
                  <li 
                    key={key} 
                    className="flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                    style={{
                      transitionDelay: `${index * 50}ms`
                    }}
                  >
                    <span className="group-hover:scale-110 transition-transform">{icon}</span>
                    <span className="font-medium group-hover:font-semibold transition-all">{featureLabel(key)}:</span>
                    {typeof value === 'boolean' ? '' :
                      typeof value === 'number' ? value.toLocaleString() :
                      value === 'unlimited' ? <span className="text-green-600 font-semibold">Unlimited</span> :
                      value === 'custom' ? <span className="italic">Custom</span> :
                      <span>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span>
                    }
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto w-full">
              {plan.name === 'Enterprise' ? (
                <Button 
                  size="sm" 
                  className="w-full group-hover:bg-primary/10 group-hover:text-primary transition-all hover:scale-105" 
                  variant="outline" 
                  onClick={() => window.location.href = 'mailto:support@example.com'}
                >
                  Hubungi Kami
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className={`w-full ${plan.name === 'Pro' ? 'animate-pulse-slow' : 'group-hover:bg-primary/90 group-hover:text-white'} transition-all hover:scale-105 hover:shadow-md hover:shadow-primary/20`}
                  // onClick={handleGetStarted}
                >
                  {plan.name === 'Free' ? 'Daftar Gratis' : `Coba ${plan.name}`}
                </Button>
              )}
            </div>
          </div>
          ))}
        </div>
      )}

      {/* CSS untuk animasi pulse pada tombol highlighted */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
          }
        }
      `}</style>

      {/* Style tag untuk animasi spin lambat */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
} 