'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiBarChart, FiShield, FiUsers, FiAlertTriangle } from 'react-icons/fi';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah login
    const token = localStorage.getItem('authToken');
    if (token) {
      // Jika sudah login, redirect ke dashboard
      router.push('/projects');
    }
  }, [router]);

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 lg:px-8 bg-background border-b border-border">
        <div className="flex items-center">
          <span className="text-xl font-bold text-primary">Error Monitor</span>
        </div>
        <div>
          <Button variant="outline" className="mr-3" onClick={handleLogin}>
            Login
          </Button>
          <Button onClick={handleGetStarted}>
            Daftar Gratis
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-8 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
            Deteksi dan Tangani Error Aplikasi Anda dengan Mudah
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Pantau, analisis, dan selesaikan error pada aplikasi web dan mobile Anda secara real-time. 
            Berhenti kehilangan pengguna karena bug yang tidak terdeteksi.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted}>
              Mulai Sekarang
            </Button>
            <Button variant="outline" size="lg" onClick={handleLogin}>
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fitur Utama</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiAlertTriangle className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Error Monitoring</h3>
              <p className="text-muted-foreground">
                Deteksi dan lacak error secara real-time dari aplikasi Anda. Dapatkan 
                informasi lengkap tentang error termasuk stack trace dan konteks.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiBarChart className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analisis Terperinci</h3>
              <p className="text-muted-foreground">
                Analisis error dengan detail yang lengkap. Lihat tren error, pengguna yang terdampak, 
                dan metrik lainnya untuk memahami penyebab masalah.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <FiUsers className="text-primary text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Kolaborasi Tim</h3>
              <p className="text-muted-foreground">
                Bekerja sama dengan tim untuk mengatasi error. Tambahkan komentar, 
                assign error ke anggota tim, dan lacak status penyelesaian.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
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

      {/* Call to Action */}
      <section className="px-6 py-16 lg:px-8 bg-primary text-primary-foreground">
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
