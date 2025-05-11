import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proyek | LogRaven',
  description: 'Kelola proyek aplikasi Anda untuk memantau dan mengelola error',
  openGraph: {
    title: 'Proyek | LogRaven',
    description: 'Kelola proyek aplikasi Anda untuk memantau dan mengelola error',
  }
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
