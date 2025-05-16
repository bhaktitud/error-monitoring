"use client";

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface HeroSectionProps {
  isAuthenticated: boolean;
  onGetStarted: () => void;
  onLogin: () => void;
  onDashboard: () => void;
}

export function HeroSection({ 
  isAuthenticated, 
  onGetStarted, 
  onLogin, 
  onDashboard 
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Hero section animation
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <motion.section 
      ref={heroRef} 
      className="px-6 py-16 lg:px-8 bg-muted" 
      style={{opacity: 1}}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1 
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Deteksi dan Tangani Error Aplikasi Anda dengan Mudah
        </motion.h1>
        <motion.p 
          className="text-lg text-muted-foreground mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Pantau, analisis, dan selesaikan error pada aplikasi web dan mobile Anda secara real-time. 
          Berhenti kehilangan pengguna karena bug yang tidak terdeteksi.
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {isAuthenticated ? (
            <Button size="lg" onClick={onDashboard}>
              Pergi ke Dashboard
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={onGetStarted}>
                Mulai Sekarang
              </Button>
              <Button variant="outline" size="lg" onClick={onLogin}>
                Login
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
} 