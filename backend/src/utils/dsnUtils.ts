import { PrismaClient, Project } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Memvalidasi DSN dan mengembalikan proyek terkait jika valid
 * @param dsn DSN yang akan divalidasi
 * @returns Project jika DSN valid, null jika tidak valid
 */
export async function validateDsn(dsn: string): Promise<Project | null> {
  try {
    if (!dsn) return null;

    // Cari project berdasarkan DSN
    const project = await prisma.project.findUnique({
      where: { dsn }
    });

    return project;
  } catch (error) {
    console.error('Error validating DSN:', error);
    return null;
  }
} 