'use client'

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiBarChart, FiShield, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const [plans, setPlans] = useState<any[]>([]);
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
          <span className="text-xl font-bold text-primary">Error Monitor</span>
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
              <h3 className="text-xl font-semibold mb-2">Error Monitoring</h3>
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
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pilih Paket yang Sesuai</h2>
          {loadingPlans ? (
            <div className="text-center">Memuat data plan...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map(plan => (
                <div key={plan.id} className={`flex flex-col bg-card border ${plan.name === 'Pro' ? 'border-2 border-primary shadow-md' : 'border-border shadow-sm'} rounded-lg p-6`}>
                  <h3 className="text-xl font-semibold mb-2 text-primary">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-4">{plan.price === 0 ? 'Rp0' : plan.price === null ? 'Custom' : `Rp${plan.price.toLocaleString()}`}</div>
                  {plan.price && plan.price > 0 && <div className="text-xs mb-2 text-muted-foreground">/bulan</div>}
                  <ul className="mb-6 text-muted-foreground text-sm flex-1 space-y-2">
                    {plan.features && Object.entries(plan.features).map(([key, value]) => (
                      <li key={key}>{key}: {typeof value === 'boolean' ? (value ? '✔️' : '❌') : value}</li>
                    ))}
                  </ul>
                  <Button size="sm" className="w-full" onClick={handleGetStarted}>
                    {plan.name === 'Free' ? 'Daftar Gratis' : plan.name === 'Enterprise' ? 'Hubungi Kami' : `Coba ${plan.name}`}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section ref={ctaRef} className="px-6 py-16 lg:px-8 bg-primary text-primary-foreground" style={{opacity: 1}}>
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
              <span className="text-lg font-semibold text-sidebar-primary-foreground">Error Monitor</span>
              <p className="text-sm mt-1">Monitor error aplikasi Anda dengan mudah</p>
            </div>
            <div className="text-sm">
              &copy; {new Date().getFullYear()} Error Monitor. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
