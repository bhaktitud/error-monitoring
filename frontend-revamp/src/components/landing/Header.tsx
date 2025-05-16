"use client";

import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onGetStarted: () => void;
  onDashboard: () => void;
}

export function Header({
  isAuthenticated = false,
  onLogin,
  onGetStarted,
  onDashboard
}: HeaderProps) {
  return (
    <motion.header 
      className="flex justify-between items-center px-6 py-4 lg:px-8 bg-background border-b border-border"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        <span className="text-xl font-bold text-primary">LogRaven</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        {isAuthenticated ? (
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="mr-3"
              onClick={onDashboard}
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
            <Button variant="outline" className="mr-3" onClick={onLogin}>
              Login
            </Button>
            <Button onClick={onGetStarted}>
              Daftar Gratis
            </Button>
          </>
        )}
      </div>
    </motion.header>
  );
} 