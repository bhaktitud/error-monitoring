import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { CookiesProvider } from "next-client-cookies/server";
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/theme-provider";

// Inter sudah diimpor melalui @fontsource, tidak perlu deklarasi khusus

// Metadata harus dideklarasikan di level modul
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "LogRaven - Monitoring Error Aplikasi",
  description: "Platform untuk memonitor dan mengelola error pada aplikasi Anda",
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    title: 'LogRaven - Monitoring Error Aplikasi',
    description: 'Platform untuk memonitor dan mengelola error pada aplikasi Anda',
    siteName: 'LogRaven',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LogRaven - Monitoring Error Aplikasi',
    description: 'Platform untuk memonitor dan mengelola error pada aplikasi Anda',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CookiesProvider>
            {children}
          </CookiesProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
