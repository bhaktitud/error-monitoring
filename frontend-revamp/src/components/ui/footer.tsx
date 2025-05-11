"use client"

import Link from 'next/link'
import { Copyright } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="w-full border-t border-sidebar-border bg-sidebar text-sidebar-foreground mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo dan deskripsi */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                LR
              </div>
              <span className="font-bold text-lg">LogRaven</span>
            </div>
            <p className="text-sm text-sidebar-foreground/80">
              Platform error monitoring untuk aplikasi Anda.
            </p>
          </div>
          
          {/* Link navigasi */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold mb-4">Navigasi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-sidebar-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-sidebar-primary transition-colors">
                  Harga
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-sidebar-primary transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-sidebar-primary transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Bantuan & Resources */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold mb-4">Bantuan & Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-sidebar-primary transition-colors">
                  Dokumentasi API
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-sidebar-primary transition-colors">
                  Panduan Pengguna
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-sidebar-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-sidebar-primary transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold mb-4">Kontak</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: support@lograven.com</li>
              <li>Phone: +62 21 1234 5678</li>
              <li>
                <div className="flex space-x-4 mt-4">
                  <Link href="#" className="hover:text-sidebar-primary transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-twitter"
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  </Link>
                  <Link href="#" className="hover:text-sidebar-primary transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-linkedin"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </Link>
                  <Link href="#" className="hover:text-sidebar-primary transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-github"
                    >
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                      <path d="M9 18c-4.51 2-5-2-7-2" />
                    </svg>
                  </Link>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-sidebar-border/50 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between text-sm text-sidebar-foreground/70">
          <div className="flex items-center">
            <Copyright className="h-4 w-4 mr-1" /> {currentYear} LogRaven. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-sidebar-primary transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-sidebar-primary transition-colors">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 