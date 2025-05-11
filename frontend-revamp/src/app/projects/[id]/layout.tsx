import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  // Metadata standar (tanpa menggunakan data dinamis)
  return {
    title: `Proyek Detail | LogRaven`,
    description: 'Detail informasi proyek dan analisis error aplikasi Anda',
    openGraph: {
      title: `Proyek Detail | LogRaven`,
      description: 'Detail informasi proyek dan analisis error aplikasi Anda',
    },
  };
  
  // TODO: Jika ingin menggunakan data dinamis dari API:
  // Contoh:
  // type Props = { params: { id: string } };
  // export async function generateMetadata({ params }: Props): Promise<Metadata> {
  //   const id = params.id;
  //   const project = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`).then(res => res.json());
  //   return {
  //     title: `${project.name} | LogRaven`,
  //     description: `Detail informasi proyek ${project.name} dan analisis error aplikasi Anda`,
  //   };
  // }
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 