"use client";

import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { FiAlertTriangle, FiBarChart, FiUsers, FiShield } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function FeatureSection() {
  const featuresRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
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
  }, []);

  return (
    <section ref={featuresRef} className="px-6 py-16 lg:px-8" style={{opacity: 1}}>
      <div className="max-w-5xl mx-auto">
        <motion.h2 
          className="text-3xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Fitur Utama
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div 
            className="feature-card bg-card p-6 rounded-lg border border-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <FiAlertTriangle className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Log & Error Tracking</h3>
            <p className="text-muted-foreground">
              Deteksi dan lacak error secara real-time dari aplikasi Anda. Dapatkan 
              informasi lengkap tentang error termasuk stack trace dan konteks.
            </p>
          </motion.div>

          <motion.div 
            className="feature-card bg-card p-6 rounded-lg border border-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <FiBarChart className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analisis Terperinci</h3>
            <p className="text-muted-foreground">
              Analisis error dengan detail yang lengkap. Lihat tren error, pengguna yang terdampak, 
              dan metrik lainnya untuk memahami penyebab masalah.
            </p>
          </motion.div>

          <motion.div 
            className="feature-card bg-card p-6 rounded-lg border border-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <FiUsers className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Kolaborasi Tim</h3>
            <p className="text-muted-foreground">
              Bekerja sama dengan tim untuk mengatasi error. Tambahkan komentar, 
              assign error ke anggota tim, dan lacak status penyelesaian.
            </p>
          </motion.div>

          <motion.div 
            className="feature-card bg-card p-6 rounded-lg border border-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <FiShield className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Integrasi Webhook</h3>
            <p className="text-muted-foreground">
              Integrasikan dengan tools lain melalui webhook. Dapatkan notifikasi 
              tentang error di Slack, Discord, atau aplikasi lainnya.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}