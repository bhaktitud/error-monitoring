"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FiStar, FiZap } from 'react-icons/fi';

interface PlanFeature {
  icon: React.ReactElement;
  label: string;
}

interface Plan {
  id: string;
  name: string;
  price: number | null;
  features: Record<string, unknown>;
}

interface PricingSectionProps {
  onGetStarted: () => void;
}

// Fungsi untuk mendapatkan ikon dan label dari kunci fitur
function getFeatureDetails(key: string): PlanFeature {
  // Mapping kunci fitur ke ikon dan label yang lebih baik
  const featureMap: Record<string, PlanFeature> = {
    eventsPerMonth: { icon: <FiZap className="text-primary" />, label: "Event per Bulan" },
    projects: { icon: <FiStar className="text-primary" />, label: "Jumlah Proyek" },
    webhook: { icon: <FiZap className="text-primary" />, label: "Webhook" },
    maxTeamMembers: { icon: <FiStar className="text-primary" />, label: "Anggota Tim" },
    retentionDays: { icon: <FiZap className="text-primary" />, label: "Masa Penyimpanan" },
    customDomain: { icon: <FiStar className="text-primary" />, label: "Domain Kustom" },
    sso: { icon: <FiZap className="text-primary" />, label: "SSO" },
    prioritySupport: { icon: <FiStar className="text-primary" />, label: "Dukungan Prioritas" },
    customIntegration: { icon: <FiZap className="text-primary" />, label: "Integrasi Kustom" },
    teamMembers: { icon: <FiStar className="text-primary" />, label: "Anggota Tim" },
    onboarding: { icon: <FiZap className="text-primary" />, label: "Onboarding" },
    allProFeatures: { icon: <FiStar className="text-primary" />, label: "Semua Fitur Pro" }
  };

  // Jika kunci ada dalam mapping, gunakan label dari mapping
  if (key in featureMap) {
    return featureMap[key];
  }

  // Jika tidak, ubah format camelCase menjadi label yang lebih baik
  const label = key
    .replace(/([A-Z])/g, ' $1') // Pisahkan huruf besar dengan spasi
    .replace(/^./, (str) => str.toUpperCase()); // Kapitalisasi huruf pertama

  return { icon: <FiStar className="text-primary" />, label };
}

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/plans`)
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  return (
    <section className="px-6 py-16 lg:px-8 bg-muted">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Pilih Paket yang Sesuai</h2>
        {loadingPlans ? (
          <div className="text-center">Memuat data plan...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                className={`flex flex-col bg-card border ${plan.name === 'Pro' ? 'border-2 border-primary shadow-md' : 'border-border shadow-sm'} rounded-lg p-6 transition-all duration-300 hover:transform hover:translate-y-[-8px] hover:shadow-lg`}
              >
                <h3 className="text-xl font-semibold mb-2 text-primary flex items-center gap-2">
                  {plan.name}
                  {plan.name === 'Pro' && <FiStar className="text-primary" />}
                </h3>
                <div className="text-3xl font-bold mb-2">
                  {plan.price === 0 ? 'Rp0' : plan.price === null ? 'Custom' : `Rp${plan.price.toLocaleString()}`}
                </div>
                {<div className="text-xs mb-4 text-muted-foreground">/bulan</div>}
                <ul className="mb-6 text-sm flex-1 space-y-3">
                  {plan.features && Object.entries(plan.features).map(([key, value]) => {
                    const { icon, label } = getFeatureDetails(key);
                    let displayValue: string;
                    
                    if (typeof value === 'boolean') {
                      displayValue = value ? 'Tersedia' : 'Tidak tersedia';
                    } else if (key === 'alert' && Array.isArray(value)) {
                      displayValue = value.join(', ');
                    } else if (value === 'unlimited' || value === 'custom') {
                      displayValue = value === 'unlimited' ? 'Tidak terbatas' : 'Kustom';
                    } else {
                      displayValue = String(value);
                    }
                    
                    return (
                      <li key={key} className="flex items-center gap-2 text-foreground">
                        {icon}
                        <span>{label}: <span className="font-medium">{displayValue}</span></span>
                      </li>
                    );
                  })}
                </ul>
                <Button 
                  size="sm" 
                  className={`w-full transition-colors duration-300 ${plan.name === 'Pro' ? 'bg-primary text-white hover:bg-primary/90' : ''}`} 
                  onClick={onGetStarted}
                >
                  {plan.name === 'Free' ? 'Daftar Gratis' : plan.name === 'Enterprise' ? 'Hubungi Kami' : `Coba ${plan.name}`}
                </Button>
                {plan.name === 'Pro' && (
                  <div className="mt-4 text-xs text-primary font-semibold flex items-center gap-1 justify-center">
                    <FiZap /> Paling Populer
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
} 