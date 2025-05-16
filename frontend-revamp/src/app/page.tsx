'use client'

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureSection } from '@/components/landing/FeatureSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CallToAction } from '@/components/landing/CallToAction';
import { FooterSection } from '@/components/landing/FooterSection';

export default function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    setIsAuthenticated(!!authToken);
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

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
        onGetStarted={handleGetStarted}
        onDashboard={handleDashboard}
      />
      
      <HeroSection 
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
        onGetStarted={handleGetStarted}
        onDashboard={handleDashboard}
      />
      
      <FeatureSection />
      
      <PricingSection onGetStarted={handleGetStarted} />
      
      <CallToAction onGetStarted={handleGetStarted} />
      
      <FooterSection />
    </div>
  );
}
