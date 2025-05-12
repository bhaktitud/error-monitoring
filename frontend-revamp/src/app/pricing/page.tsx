"use client";
import { useEffect, useState } from "react";
import { Button } from '@/components/ui/button';
import { FiCheck, FiZap, FiStar, FiMail, FiSlack, FiUsers, FiCalendar, FiActivity, FiServer, FiLock, FiHeadphones, FiCode, FiArrowLeft, FiX } from 'react-icons/fi';
import { apiRequest } from '@/lib/api';
import React from 'react';
import { useRouter } from "next/navigation";
import PageTransition from '@/components/ui/page-transition';
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Footer from '@/components/ui/footer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Plan {
  id: string;
  name: string;
  price: number | null;
  features: Record<string, unknown>;
  highlight?: boolean;
}

// Fungsi untuk mendapatkan ikon dan label dari kunci fitur
function getFeatureDetails(key: string, value: unknown) {
  // Mapping kunci fitur ke ikon dan label yang lebih baik
  const featureMap: Record<string, { icon: React.ReactElement, label: string }> = {
    eventsPerMonth: { icon: <FiActivity className="text-primary" />, label: "Event per Bulan" },
    projects: { icon: <FiServer className="text-primary" />, label: "Jumlah Proyek" },
    webhook: { icon: <FiCode className="text-primary" />, label: "Webhook" },
    maxTeamMembers: { icon: <FiUsers className="text-primary" />, label: "Anggota Tim" },
    retentionDays: { icon: <FiCalendar className="text-primary" />, label: "Masa Penyimpanan" },
    alert: { 
      icon: Array.isArray(value) && value.includes('slack') 
        ? <FiSlack className="text-primary" /> 
        : <FiMail className="text-primary" />, 
      label: "Notifikasi" 
    },
    customDomain: { icon: <FiServer className="text-primary" />, label: "Domain Kustom" },
    sso: { icon: <FiLock className="text-primary" />, label: "SSO" },
    prioritySupport: { icon: <FiHeadphones className="text-primary" />, label: "Dukungan Prioritas" },
    customIntegration: { icon: <FiSlack className="text-primary" />, label: "Integrasi Kustom" },
    teamMembers: { icon: <FiUsers className="text-primary" />, label: "Anggota Tim" },
    onboarding: { icon: <FiUsers className="text-primary" />, label: "Onboarding" },
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

  return { icon: <FiCheck className="text-primary" />, label };
}

export default function PricingPage() {
  const router = useRouter();
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

  const handleGetStarted = () => {
    router.push('/register');
  };

  // Kumpulkan semua kunci fitur unik dan detailnya
  const allFeatureKeys = new Set<string>();
  if (plans.length > 0) {
    plans.forEach(plan => {
      if (plan.features) {
        Object.keys(plan.features).forEach(key => allFeatureKeys.add(key));
      }
    });
  }
  const uniqueFeatureDetails = Array.from(allFeatureKeys).map(key => {
    const representativePlan = plans.find(p => p.features && p.features[key] !== undefined);
    const representativeValue = representativePlan?.features[key];
    const details = getFeatureDetails(key, representativeValue); // Gunakan representativeValue untuk ikon yang lebih akurat jika diperlukan
    return { key, label: details.label, icon: details.icon };
  });

  // Fungsi pembantu untuk merender nilai fitur dalam tabel
  const renderFeatureValue = (featureKey: string, value: unknown) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">-</span>;
    }
    if (typeof value === 'boolean') {
      return value ? <FiCheck className="text-green-500 mx-auto" size={20} /> : <FiX className="text-red-500 mx-auto" size={20} />;
    }
    if (featureKey === 'alert' && Array.isArray(value)) {
      return value.map(val => String(val).charAt(0).toUpperCase() + String(val).slice(1)).join(', '); // Kapitalisasi dan gabung
    }
    if (value === 'unlimited') {
      return 'Tak Terbatas';
    }
    if (value === 'custom') {
      return 'Kustom';
    }
    return String(value);
  };

  return (
    <PageTransition>
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex-1">
      <div className="flex justify-between items-center mb-8">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <FiArrowLeft /> Kembali ke Beranda
              </Button>
            </Link>
            <ThemeSwitcher />
          </div>
      <div className="min-h-screen bg-background py-16 px-4 flex flex-col items-center">


        <h1 className="text-4xl font-bold mb-4 text-center">Pilih Paket yang Sesuai</h1>
        <p className="text-muted-foreground mb-12 text-center max-w-2xl">
          Mulai gratis dan upgrade kapan saja. Semua paket sudah termasuk monitoring error real-time, dashboard modern, dan integrasi mudah ke aplikasi Anda.
        </p>
        {loading ? (
          <div className="text-center py-12">Memuat paket...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col bg-card border ${plan.highlight ? 'border-2 border-primary shadow-md' : 'border-border shadow-sm'} rounded-lg p-6 transition-all duration-300 hover:transform hover:translate-y-[-8px] hover:shadow-lg`}
                >
                  <h3 className="text-xl font-semibold mb-2 text-primary flex items-center gap-2">
                    {plan.name}
                    {plan.highlight && <FiStar className="text-primary" />}
                  </h3>
                  <div className="text-3xl font-bold mb-2">{plan.price === 0 ? 'Rp0' : plan.price === null ? 'Custom' : `Rp${plan.price.toLocaleString()}`}</div>
                  {<div className="text-xs mb-4 text-muted-foreground">/bulan</div>}
                  <ul className="mb-6 text-sm flex-1 space-y-3">
                    {plan.features && Object.entries(plan.features).map(([key, value]) => {
                      const { icon, label } = getFeatureDetails(key, value);
                      let displayValue: string;

                      if (typeof value === 'boolean') {
                        displayValue = value ? 'Tersedia' : 'Tidak tersedia';
                      } else if (key === 'alert' && Array.isArray(value)) {
                        displayValue = value.map(val => String(val).charAt(0).toUpperCase() + String(val).slice(1)).join(', ');
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
                    className={`w-full transition-colors duration-300 ${plan.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                    onClick={handleGetStarted}
                  >
                    {plan.name === 'Free' ? 'Daftar Gratis' : plan.name === 'Enterprise' ? 'Hubungi Kami' : `Coba ${plan.name}`}
                  </Button>
                  {plan.highlight && (
                    <div className="mt-4 text-xs text-primary font-semibold flex items-center gap-1 justify-center">
                      <FiZap /> Paling Populer
                    </div>
                  )}
                </div>
              ))}
            </div>

            {plans.length > 0 && (
              <div className="mt-16 w-full mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center">Perbandingan Rinci Paket</h2>
                <div className="overflow-x-auto">
                  <Table className="border rounded-lg ">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] md:w-[250px] text-left sticky left-0 bg-card z-10 py-4 px-6">Fitur</TableHead>
                        {plans.map(plan => (
                          <TableHead key={plan.id} className={`text-center min-w-[150px] py-4 px-6 ${plan.highlight ? 'text-primary font-semibold' : ''}`}>
                            {plan.name}
                            {plan.highlight && <FiStar className="inline ml-1 text-primary" />}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold text-left sticky left-0 bg-card z-10 py-4 px-6">Harga</TableCell>
                        {plans.map(plan => (
                          <TableCell key={plan.id} className={`text-center font-bold py-4 px-6 ${plan.highlight ? 'text-primary' : ''}`}>
                            <div>{plan.price === 0 ? 'Rp0' : plan.price === null ? 'Custom' : `Rp${plan.price.toLocaleString()}`}</div>
                            {plan.price !== null && <div className="text-xs font-normal text-muted-foreground">/bulan</div>}
                          </TableCell>
                        ))}
                      </TableRow>

                      {uniqueFeatureDetails.map(feature => (
                        <TableRow key={feature.key}>
                          <TableCell className="font-medium text-left flex items-center gap-2 sticky left-0 bg-card z-10 py-4 px-6">
                            {feature.icon}
                            {feature.label}
                          </TableCell>
                          {plans.map(plan => {
                            const featureValue = plan.features?.[feature.key];
                            return (
                              <TableCell key={plan.id} className={`text-center py-4 px-6 ${plan.highlight && featureValue !== undefined && typeof featureValue === 'boolean' && featureValue ? 'font-semibold' : ''}`}>
                                {renderFeatureValue(feature.key, featureValue)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="text-left sticky left-0 bg-card z-10 py-4 px-6"></TableCell>
                        {plans.map(plan => (
                          <TableCell key={plan.id} className="text-center py-4 px-6">
                            <Button
                              size="sm"
                              className={`w-full max-w-[150px] mx-auto transition-colors duration-300 ${plan.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                              onClick={() => {
                                handleGetStarted();
                              }}
                            >
                              {plan.name === 'Free' ? 'Daftar Gratis' : plan.name === 'Enterprise' ? 'Hubungi Kami' : `Mulai ${plan.name}`}
                            </Button>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      <Footer />
      </div>
    </PageTransition>
  );
} 