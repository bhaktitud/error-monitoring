'use client'

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiBarChart, FiShield, FiUsers, FiAlertTriangle, FiCheck, FiZap, FiStar, FiMail, FiSlack, FiCalendar, FiActivity, FiServer, FiLock, FiHeadphones, FiCode } from 'react-icons/fi';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React from 'react';

interface Plan {
  id: string;
  name: string;
  price: number | null;
  features: Record<string, unknown>;
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

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero section animation
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );
    }

    // Features animation
    if (featuresRef.current) {
      const featureCards = featuresRef.current.querySelectorAll('.feature-card');
      if (featureCards && featureCards.length > 0) {
        gsap.fromTo(
          featureCards,
          { opacity: 0, y: 50 },
          {
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top center+=100",
              toggleActions: "play none none reverse"
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out"
          }
        );
      } else {
        // fallback: pastikan feature cards tetap terlihat
        featureCards.forEach(card => (card as HTMLElement).style.opacity = '1');
      }
    }

    // CTA section animation
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, scale: 0.9 },
        {
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top center+=100",
            toggleActions: "play none none reverse"
          },
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: "power2.out"
        }
      );
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/plans`)
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleDashboard = () => {
    router.push('/projects');
  };

  // Simple check for client-side
  let isAuthenticated = false;
  let isClient = false;

  if (typeof window !== 'undefined') {
    isClient = true;
    isAuthenticated = !!localStorage.getItem('authToken');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 lg:px-8 bg-background border-b border-border">
        <div className="flex items-center">
          <span className="text-xl font-bold text-primary">LogRaven</span>
        </div>
        <div>
          {!isClient ? (
            <div className="h-8 w-20 animate-pulse bg-muted rounded"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center">
              <Button 
                variant="outline" 
                className="mr-3"
                onClick={handleDashboard}
              >
                Dashboard
              </Button>
              <Link href="/account/profile">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium">
                  U
                </div>
              </Link>
            </div>
          ) : (
            <>
              <Button variant="outline" className="mr-3" onClick={handleLogin}>
                Login
              </Button>
              <Button onClick={handleGetStarted}>
                Daftar Gratis
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="px-6 py-16 lg:px-8 bg-muted" style={{opacity: 1}}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
            Deteksi dan Tangani Error Aplikasi Anda dengan Mudah
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Pantau, analisis, dan selesaikan error pada aplikasi web dan mobile Anda secara real-time. 
            Berhenti kehilangan pengguna karena bug yang tidak terdeteksi.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isClient && isAuthenticated ? (
              <Button size="lg" onClick={handleDashboard}>
                Pergi ke Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={handleGetStarted}>
                  Mulai Sekarang
                </Button>
                <Button variant="outline" size="lg" onClick={handleLogin}>
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="px-6 py-16 lg:px-8" style={{opacity: 1}}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fitur Utama</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="feature-card bg-card p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiAlertTriangle className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Log & Error Tracking</h3>
              <p className="text-muted-foreground">
                Deteksi dan lacak error secara real-time dari aplikasi Anda. Dapatkan 
                informasi lengkap tentang error termasuk stack trace dan konteks.
              </p>
            </div>

            <div className="feature-card bg-card p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiBarChart className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analisis Terperinci</h3>
              <p className="text-muted-foreground">
                Analisis error dengan detail yang lengkap. Lihat tren error, pengguna yang terdampak, 
                dan metrik lainnya untuk memahami penyebab masalah.
              </p>
            </div>

            <div className="feature-card bg-card p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiUsers className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Kolaborasi Tim</h3>
              <p className="text-muted-foreground">
                Bekerja sama dengan tim untuk mengatasi error. Tambahkan komentar, 
                assign error ke anggota tim, dan lacak status penyelesaian.
              </p>
            </div>

            <div className="feature-card bg-card p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiShield className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Integrasi Webhook</h3>
              <p className="text-muted-foreground">
                Integrasikan dengan tools lain melalui webhook. Dapatkan notifikasi 
                tentang error di Slack, Discord, atau aplikasi lainnya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plan */}
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
                  <div className="text-3xl font-bold mb-2">{plan.price === 0 ? 'Rp0' : plan.price === null ? 'Custom' : `Rp${plan.price.toLocaleString()}`}</div>
                  {<div className="text-xs mb-4 text-muted-foreground">/bulan</div>}
                  <ul className="mb-6 text-sm flex-1 space-y-3">
                    {plan.features && Object.entries(plan.features).map(([key, value]) => {
                      const { icon, label } = getFeatureDetails(key, value);
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
                    onClick={handleGetStarted}
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

      {/* Call to Action */}
      <section ref={ctaRef} className="px-6 py-16 lg:px-8 text-primary-foreground" style={{opacity: 1}}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Mulai Pantau Error Aplikasi Anda Hari Ini</h2>
          <p className="text-lg mb-8">
            Mendaftar gratis dan mulai melacak error pada aplikasi Anda dalam hitungan menit.
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-background text-primary hover:bg-muted"
            onClick={handleGetStarted}
          >
            Buat Akun Sekarang
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 lg:px-8 bg-sidebar text-sidebar-foreground">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-lg font-semibold text-sidebar-primary-foreground">LogRaven</span>
              <p className="text-sm mt-1">Monitor error aplikasi Anda dengan mudah</p>
            </div>
            <div className="text-sm">
              &copy; {new Date().getFullYear()} LogRaven. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
