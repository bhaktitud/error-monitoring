"use client";

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface CallToActionProps {
  onGetStarted: () => void;
}

export function CallToAction({ onGetStarted }: CallToActionProps) {
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
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
  }, []);

  return (
    <motion.section 
      ref={ctaRef} 
      className="px-6 py-16 lg:px-8" 
      style={{ opacity: 1 }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2 
          className="text-2xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Mulai Pantau Error Aplikasi Anda Hari Ini
        </motion.h2>
        <motion.p 
          className="text-lg mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Mendaftar gratis dan mulai melacak error pada aplikasi Anda dalam hitungan menit.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-background text-primary hover:bg-muted"
            onClick={onGetStarted}
          >
            Buat Akun Sekarang
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
} 