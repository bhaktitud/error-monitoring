'use client'

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiBarChart, FiShield, FiUsers, FiAlertTriangle, FiCheckCircle, FiZap, FiCheck, FiX, FiSettings } from 'react-icons/fi';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Plan = {
  id: string;
  name: string;
  price: number | null;
  features: Record<string, boolean | string>;
};

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
    }
    if (featuresRef.current) {
      const featureCards = featuresRef.current.querySelectorAll('.feature-card');
      if (featureCards && featureCards.length > 0) {
        gsap.fromTo(
          featureCards,
          { opacity: 0, y: 50 },
          {
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top center+=100',
              toggleActions: 'play none none reverse',
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out',
          }
        );
      } else {
        featureCards.forEach(card => (card as HTMLElement).style.opacity = '1');
      }
    }
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, scale: 0.9 },
        {
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top center+=100',
            toggleActions: 'play none none reverse',
          },
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        }
      );
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/plans`)
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(() => setPlansError('Gagal memuat paket harga'))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleGetStarted = () => router.push('/register');
  const handleLogin = () => router.push('/login');
  const handleDashboard = () => router.push('/projects');

  let isAuthenticated = false;
  let isClient = false;
  if (typeof window !== 'undefined') {
    isClient = true;
    isAuthenticated = !!localStorage.getItem('authToken');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 lg:px-12 bg-background/80 border-b border-border sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center">
          <span className="text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2">
            <FiZap className="text-yellow-400" /> LogRaven
          </span>
        </div>
        <div>
          {!isClient ? (
            <div className="h-8 w-20 animate-pulse bg-muted rounded"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center">
              <Button variant="outline" className="mr-3" onClick={handleDashboard}>
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
      <section ref={heroRef} className="px-6 py-24 lg:px-0 bg-gradient-to-br from-primary/5 to-background flex flex-col items-center justify-center relative overflow-hidden">
        <svg className="absolute left-0 top-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1440 320"><path fill="#6366f1" fillOpacity="0.2" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path></svg>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-6 leading-tight">
            Pantau & Atasi Error Aplikasi Anda <span className="text-primary">Lebih Cepat</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            LogRaven membantu developer dan tim QA mendeteksi, menganalisis, dan menyelesaikan error pada aplikasi web & mobile secara real-time. Fokus pada pengembangan, biarkan kami yang menjaga kestabilan aplikasi Anda.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isClient && isAuthenticated ? (
              <Button size="lg" onClick={handleDashboard}>
                Pergi ke Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={handleGetStarted}>
                  Coba Gratis Sekarang
                </Button>
                <Button variant="outline" size="lg" onClick={handleLogin}>
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Keunggulan */}
      <section className="px-6 py-16 lg:px-0 bg-background">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FiCheckCircle className="text-primary text-3xl" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Instalasi Mudah</h3>
            <p className="text-muted-foreground">Integrasi SDK hanya butuh beberapa menit. Dokumentasi lengkap & contoh kode siap pakai.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FiShield className="text-primary text-3xl" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Keamanan Data</h3>
            <p className="text-muted-foreground">Data error Anda dienkripsi dan hanya dapat diakses oleh tim Anda. Privasi dan keamanan adalah prioritas kami.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FiZap className="text-primary text-3xl" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Notifikasi Real-time</h3>
            <p className="text-muted-foreground">Dapatkan notifikasi instan ke Slack, Email, atau Webhook setiap kali error kritis terjadi.</p>
          </div>
        </div>
      </section>

      {/* Fitur Utama */}
      <section ref={featuresRef} className="px-6 py-16 lg:px-0">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fitur Unggulan LogRaven</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="feature-card bg-card p-8 rounded-xl border border-border shadow-sm flex flex-col items-start">
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiAlertTriangle className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Error Monitoring Otomatis</h3>
              <p className="text-muted-foreground mb-2">
                Deteksi dan lacak error secara real-time dari aplikasi Anda. Dapatkan informasi lengkap tentang error termasuk stack trace dan user context.
              </p>
            </div>
            <div className="feature-card bg-card p-8 rounded-xl border border-border shadow-sm flex flex-col items-start">
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiBarChart className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analisis & Insight Mendalam</h3>
              <p className="text-muted-foreground mb-2">
                Analisis error dengan detail lengkap. Lihat tren error, pengguna terdampak, dan metrik lain untuk memahami akar masalah.
              </p>
            </div>
            <div className="feature-card bg-card p-8 rounded-xl border border-border shadow-sm flex flex-col items-start">
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiUsers className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Kolaborasi Tim</h3>
              <p className="text-muted-foreground mb-2">
                Assign error ke anggota tim, diskusi langsung di error detail, dan pantau progres penyelesaian secara transparan.
              </p>
            </div>
            <div className="feature-card bg-card p-8 rounded-xl border border-border shadow-sm flex flex-col items-start">
              <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiShield className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Keamanan & Privasi</h3>
              <p className="text-muted-foreground mb-2">
                Data error terenkripsi, akses terbatas hanya untuk tim Anda. LogRaven mematuhi standar keamanan industri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 lg:px-0 bg-muted">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pilih Paket yang Sesuai</h2>
          {loadingPlans ? (
            <div className="text-center">Memuat data paket...</div>
          ) : plansError ? (
            <div className="text-center text-destructive">{plansError}</div>
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
                        onClick={handleGetStarted}
                      >
                        {plan.name === 'Free' ? 'Daftar Gratis' : `Coba ${plan.name}`}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Akhir */}
      <section ref={ctaRef} className="px-6 py-20 from-primary/10 to-primary/5 flex flex-col items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Siap Meningkatkan Kualitas Aplikasi Anda?</h2>
          <p className="text-lg text-muted-foreground mb-8">Coba LogRaven gratis sekarang dan rasakan kemudahan monitoring error modern.</p>
          <Button size="lg" onClick={handleGetStarted}>
            Daftar & Mulai Gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 px-6 lg:px-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-primary">
            <FiZap className="text-yellow-400" /> LogRaven
          </div>
          <div className="flex gap-6 text-muted-foreground text-sm">
            <Link href="/pricing" className="hover:underline">Pricing</Link>
            <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Docs</a>
            <a href="mailto:support@example.com" className="hover:underline">Kontak</a>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">Twitter</a>
          </div>
          <div className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} LogRaven. All rights reserved.</div>
        </div>
      </footer>

      {/* Style untuk animasi */}
      <style jsx global>{`
        @keyframes pulse-slow {
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
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
      `}</style>
    </div>
  );
}
