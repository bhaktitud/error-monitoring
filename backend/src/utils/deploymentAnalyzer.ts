import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Interface untuk hasil analisis deployment
 */
interface DeploymentAnalysisResult {
  deployment: {
    id: string;
    version: string;
    environment: string;
    commitHash?: string;
    deployedAt: Date;
  };
  errorTrend: {
    before: number;
    after: number;
    percentChange: number;
  };
  newErrorGroups: Array<{
    id: string;
    message: string;
    count: number;
    firstSeen: Date;
  }>;
  potentialCulprits: Array<{
    file: string;
    changeCount: number;
    errorCorrelation: number;
  }>;
}

/**
 * Kelas untuk menganalisis hubungan antara deployment dan error
 */
export class DeploymentAnalyzer {
  /**
   * Menganalisis dampak sebuah deployment terhadap kemunculan error
   * 
   * @param deploymentId ID dari deployment yang akan dianalisis
   * @param timeWindow Jendela waktu dalam jam untuk analisis sebelum dan sesudah deployment
   */
  async analyzeDeploymentImpact(
    deploymentId: string,
    timeWindow: number = 24
  ): Promise<DeploymentAnalysisResult> {
    // Ambil detail deployment
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: {
        id: true,
        projectId: true,
        version: true,
        environment: true,
        commitHash: true,
        deployedAt: true,
        changedFiles: true,
      }
    });

    if (!deployment) {
      throw new Error('Deployment tidak ditemukan');
    }

    // Menghitung timestamp untuk analisis
    const deploymentDate = deployment.deployedAt;
    const beforeStart = new Date(deploymentDate.getTime() - (timeWindow * 60 * 60 * 1000));
    const afterEnd = new Date(deploymentDate.getTime() + (timeWindow * 60 * 60 * 1000));

    // Menghitung jumlah error sebelum deployment
    const errorCountBefore = await prisma.event.count({
      where: {
        projectId: deployment.projectId,
        timestamp: {
          gte: beforeStart,
          lt: deploymentDate
        }
      }
    });

    // Menghitung jumlah error setelah deployment
    const errorCountAfter = await prisma.event.count({
      where: {
        projectId: deployment.projectId,
        timestamp: {
          gte: deploymentDate,
          lte: afterEnd
        }
      }
    });

    // Menghitung perubahan persentase
    const percentChange = errorCountBefore > 0 
      ? ((errorCountAfter - errorCountBefore) / errorCountBefore) * 100 
      : (errorCountAfter > 0 ? 100 : 0);

    // Menemukan error group baru setelah deployment
    const newErrorGroups = await prisma.errorGroup.findMany({
      where: {
        projectId: deployment.projectId,
        firstSeen: {
          gte: deploymentDate,
          lte: afterEnd
        }
      },
      select: {
        id: true,
        message: true,
        count: true,
        firstSeen: true
      },
      orderBy: {
        count: 'desc'
      },
      take: 10
    });

    // Analisis file yang berubah dan korelasinya dengan error
    const potentialCulprits: Array<{
      file: string;
      changeCount: number;
      errorCorrelation: number;
    }> = [];

    // Jika ada informasi file yang berubah
    if (deployment.changedFiles) {
      const changedFiles = deployment.changedFiles as string[];
      
      // Untuk setiap file yang berubah, hitung korelasi dengan error
      for (const file of changedFiles) {
        // Ini bisa dikembangkan lebih lanjut dengan analisis yang lebih kompleks
        // Misalnya mencari hubungan dengan stacktrace atau melihat pola historis
        const errorCorrelation = Math.random(); // Placeholder untuk logika korelasi sebenarnya
        
        potentialCulprits.push({
          file,
          changeCount: 1, // Placeholder untuk jumlah perubahan sebenarnya
          errorCorrelation: errorCorrelation
        });
      }
      
      // Urutkan berdasarkan korelasi error tertinggi
      potentialCulprits.sort((a, b) => b.errorCorrelation - a.errorCorrelation);
    }

    return {
      deployment: {
        id: deployment.id,
        version: deployment.version,
        environment: deployment.environment,
        commitHash: deployment.commitHash || undefined,
        deployedAt: deployment.deployedAt
      },
      errorTrend: {
        before: errorCountBefore,
        after: errorCountAfter,
        percentChange
      },
      newErrorGroups,
      potentialCulprits
    };
  }

  /**
   * Mengaitkan error group dengan deployment berdasarkan waktu pertama kali terlihat
   * 
   * @param errorGroupId ID dari error group yang akan dikaitkan
   * @param lookbackDays Jumlah hari untuk melihat kembali sebelum error pertama kali terlihat
   */
  async linkErrorToDeployment(
    errorGroupId: string,
    lookbackDays: number = 7
  ): Promise<{
    linked: boolean;
    deploymentId?: string;
    deploymentVersion?: string;
  }> {
    // Ambil detail error group
    const errorGroup = await prisma.errorGroup.findUnique({
      where: { id: errorGroupId },
      select: {
        id: true,
        projectId: true,
        firstSeen: true
      }
    });

    if (!errorGroup) {
      throw new Error('Error group tidak ditemukan');
    }

    // Tentukan rentang waktu untuk pencarian deployment
    const errorFirstSeen = errorGroup.firstSeen;
    const lookbackDate = new Date(errorFirstSeen.getTime() - (lookbackDays * 24 * 60 * 60 * 1000));

    // Cari deployment yang dilakukan sebelum error pertama kali terlihat
    const deployment = await prisma.deployment.findFirst({
      where: {
        projectId: errorGroup.projectId,
        deployedAt: {
          gte: lookbackDate,
          lte: errorFirstSeen
        }
      },
      orderBy: {
        deployedAt: 'desc' // Ambil deployment terbaru sebelum error
      },
      select: {
        id: true,
        version: true
      }
    });

    if (!deployment) {
      return { linked: false };
    }

    // Cek apakah sudah ada relasi antara error group dan deployment
    const existingRelation = await prisma.errorDeploymentRelation.findFirst({
      where: {
        errorGroupId: errorGroup.id,
        deploymentId: deployment.id
      }
    });

    // Jika belum ada, buat relasi baru
    if (!existingRelation) {
      await prisma.errorDeploymentRelation.create({
        data: {
          errorGroupId: errorGroup.id,
          deploymentId: deployment.id,
          firstSeenAt: errorFirstSeen
        }
      });
    }

    return {
      linked: true,
      deploymentId: deployment.id,
      deploymentVersion: deployment.version
    };
  }

  /**
   * Menganalisis perubahan kode antara dua deployment
   * 
   * @param fromDeploymentId ID deployment awal
   * @param toDeploymentId ID deployment akhir
   */
  async analyzeCodeChanges(
    fromDeploymentId: string,
    toDeploymentId: string
  ): Promise<{
    changedFiles: Array<{
      filename: string;
      changeType: 'added' | 'modified' | 'deleted';
      changes: number;
    }>;
    commitCount: number;
    totalChanges: number;
  }> {
    // Ambil detail kedua deployment
    const [fromDeployment, toDeployment] = await Promise.all([
      prisma.deployment.findUnique({
        where: { id: fromDeploymentId },
        select: {
          id: true,
          commitHash: true,
          repository: true
        }
      }),
      prisma.deployment.findUnique({
        where: { id: toDeploymentId },
        select: {
          id: true,
          commitHash: true,
          repository: true,
          changedFiles: true
        }
      })
    ]);

    if (!fromDeployment || !toDeployment) {
      throw new Error('Deployment tidak ditemukan');
    }

    if (fromDeployment.repository !== toDeployment.repository) {
      throw new Error('Kedua deployment harus berasal dari repository yang sama');
    }

    // Placeholder untuk hasil analisis
    // Pada implementasi sebenarnya, ini akan menggunakan data dari API Git
    // atau memproses output dari perintah git seperti: git diff --stat <fromCommit> <toCommit>
    
    // Contoh result
    const changedFiles = toDeployment.changedFiles 
      ? (toDeployment.changedFiles as string[]).map(file => ({
          filename: file,
          changeType: Math.random() > 0.2 
            ? 'modified' as const
            : (Math.random() > 0.5 ? 'added' as const : 'deleted' as const),
          changes: Math.floor(Math.random() * 100) + 1
        }))
      : [];
    
    const totalChanges = changedFiles.reduce((sum, file) => sum + file.changes, 0);
    
    return {
      changedFiles,
      commitCount: Math.floor(Math.random() * 10) + 1, // Placeholder
      totalChanges
    };
  }

  /**
   * Mendapatkan error yang muncul dalam jangka waktu tertentu untuk deployment
   */
  async getErrorsForDeployment(
    deploymentId: string,
    timeframeHours: number = 24
  ): Promise<Array<{
    id: string;
    message: string;
    count: number;
    firstSeen: Date;
  }>> {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: {
        projectId: true,
        deployedAt: true
      }
    });

    if (!deployment) {
      throw new Error('Deployment tidak ditemukan');
    }

    const startTime = deployment.deployedAt;
    const endTime = new Date(startTime.getTime() + (timeframeHours * 60 * 60 * 1000));

    const errors = await prisma.errorGroup.findMany({
      where: {
        projectId: deployment.projectId,
        firstSeen: {
          gte: startTime,
          lte: endTime
        }
      },
      select: {
        id: true,
        message: true,
        count: true,
        firstSeen: true
      },
      orderBy: {
        count: 'desc'
      }
    });

    return errors;
  }
} 