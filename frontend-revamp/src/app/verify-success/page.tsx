'use client'

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FiCheck } from 'react-icons/fi';
import PageTransition from '@/components/ui/page-transition';
import { ThemeSwitcher } from '@/components/theme-switcher';
import Link from 'next/link';
import { FiChevronLeft } from 'react-icons/fi';

export default function VerifySuccessPage() {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-[#0B2447] via-[#19376D] to-[#576CBC]">
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
              <FiChevronLeft className="mr-2" /> Kembali
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4">
          <ThemeSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="bg-card/95 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-primary-foreground/10 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <FiCheck className="text-primary text-3xl" />
            </div>
            <h1 className="text-2xl font-semibold mb-3">Email Berhasil Diverifikasi!</h1>
            <p className="text-muted-foreground mb-8">
              Akun Anda telah berhasil diaktifkan. Anda sekarang dapat menggunakan semua fitur LogRaven.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Masuk Sekarang
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
} 