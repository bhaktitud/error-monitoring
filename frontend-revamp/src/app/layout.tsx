import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CookiesProvider } from "next-client-cookies/server";
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Error Monitor - Monitoring Error Aplikasi",
  description: "Platform untuk memonitor dan mengelola error pada aplikasi Anda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
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
