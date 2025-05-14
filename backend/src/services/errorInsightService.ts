import { PrismaClient } from '@prisma/client';
import { subHours, subDays } from 'date-fns';

const prisma = new PrismaClient();

interface ErrorCorrelation {
  fromErrorId: string;
  fromErrorType: string;
  fromErrorMessage: string;
  toErrorId: string;
  toErrorType: string;
  toErrorMessage: string;
  count: number;
  percentage: number;
}

interface UserImpact {
  errorGroupId: string;
  errorType: string;
  message: string;
  impactLastHour: number;
  impactLastDay: number;
  impactLastWeek: number;
  totalUsersLastHour: number;
  totalUsersLastDay: number;
  totalUsersLastWeek: number;
}

/**
 * Service untuk menganalisis korelasi error dan dampak pengguna
 */
export class ErrorInsightService {
  /**
   * Menganalisis korelasi antar error - error mana yang sering terjadi sebelum error tertentu
   */
  async analyzeErrorCorrelations(
    projectId: string,
    errorGroupId: string,
    timeWindow: '24h' | '7d' | '30d' = '7d'
  ): Promise<ErrorCorrelation[]> {
    let startDate: Date;
    
    // Tentukan jendela waktu analisis
    switch (timeWindow) {
      case '24h':
        startDate = subHours(new Date(), 24);
        break;
      case '30d':
        startDate = subDays(new Date(), 30);
        break;
      case '7d':
      default:
        startDate = subDays(new Date(), 7);
        break;
    }

    try {
      // Ambil semua sequence error yang berakhir pada errorGroupId
      const errorSequences = await prisma.errorSequence.findMany({
        where: {
          projectId,
          toErrorId: errorGroupId,
          occurredAt: {
            gte: startDate
          }
        },
        include: {
          fromError: {
            select: {
              id: true,
              errorType: true,
              message: true
            }
          },
          toError: {
            select: {
              id: true,
              errorType: true,
              message: true
            }
          }
        }
      });

      // Hitung jumlah total sequence yang berakhir pada errorGroupId
      const totalSequences = errorSequences.length;
      
      if (totalSequences === 0) {
        return [];
      }

      // Hitung frekuensi tiap error yang muncul sebelum errorGroupId
      const correlations: Record<string, {
        fromErrorId: string;
        fromErrorType: string;
        fromErrorMessage: string;
        count: number;
      }> = {};

      errorSequences.forEach(sequence => {
        const { fromError } = sequence;
        
        if (!correlations[fromError.id]) {
          correlations[fromError.id] = {
            fromErrorId: fromError.id,
            fromErrorType: fromError.errorType,
            fromErrorMessage: fromError.message,
            count: 0
          };
        }
        
        correlations[fromError.id].count++;
      });

      // Ubah ke array dan hitung persentase
      const result = Object.values(correlations).map(corr => ({
        fromErrorId: corr.fromErrorId,
        fromErrorType: corr.fromErrorType,
        fromErrorMessage: corr.fromErrorMessage,
        toErrorId: errorGroupId,
        toErrorType: errorSequences[0].toError.errorType,
        toErrorMessage: errorSequences[0].toError.message,
        count: corr.count,
        percentage: (corr.count / totalSequences) * 100
      }));

      // Urutkan berdasarkan persentase tertinggi
      return result.sort((a, b) => b.percentage - a.percentage);
    } catch (error) {
      console.error('Error analyzing error correlations:', error);
      throw error;
    }
  }

  /**
   * Saat terdeteksi error baru, catat dalam error sequence jika pengguna mengalami error sebelumnya
   */
  async recordErrorSequence(
    projectId: string,
    userId: string | null,
    errorGroupId: string,
    sessionId: string | null = null
  ): Promise<void> {
    if (!userId && !sessionId) {
      // Tidak cukup informasi untuk mentracking sequence
      return;
    }

    try {
      // Cari error terakhir dari user/session ini dalam 30 menit terakhir
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const whereClause: any = {
        projectId,
        occurredAt: {
          gte: thirtyMinutesAgo
        },
        toErrorId: {
          not: errorGroupId // Jangan ambil sequence yang berakhir pada error saat ini
        }
      };

      // Filter berdasarkan userId atau sessionId
      if (userId) {
        whereClause.userId = userId;
      } else if (sessionId) {
        whereClause.sessionId = sessionId;
      }

      // Ambil error terakhir yang dialami pengguna ini
      const lastErrorSequence = await prisma.errorSequence.findFirst({
        where: whereClause,
        orderBy: {
          occurredAt: 'desc'
        },
        include: {
          toError: true
        }
      });

      if (lastErrorSequence) {
        // Hitung waktu antara error terakhir dan error saat ini (dalam detik)
        const lastErrorTime = lastErrorSequence.occurredAt.getTime();
        const currentTime = Date.now();
        const timeGap = Math.floor((currentTime - lastErrorTime) / 1000);

        // Catat sequence dari error terakhir ke error saat ini
        await prisma.errorSequence.create({
          data: {
            projectId,
            userId: userId || null,
            sessionId: sessionId || null,
            fromErrorId: lastErrorSequence.toErrorId,
            toErrorId: errorGroupId,
            timeGap,
          }
        });
      }

      // Selalu catat error saat ini sebagai akhir sequence baru
      // (untuk potensial sequence selanjutnya)
      await prisma.errorSequence.create({
        data: {
          projectId,
          userId: userId || null,
          sessionId: sessionId || null,
          fromErrorId: errorGroupId,
          toErrorId: errorGroupId, // Set sama untuk menandai ini adalah error terbaru
          timeGap: 0
        }
      });
    } catch (error) {
      console.error('Error recording error sequence:', error);
      // Jangan throw error, karena ini operasi non-kritis
    }
  }

  /**
   * Menghitung dampak error pada pengguna (persentase pengguna yang terpengaruh)
   */
  async calculateUserImpact(
    projectId: string, 
    errorGroupId: string | null = null,
    timeWindow: '1h' | '24h' | '7d' = '1h'
  ): Promise<UserImpact[]> {
    try {
      let startDate: Date;
      
      // Tentukan jendela waktu analisis
      switch (timeWindow) {
        case '1h':
          startDate = subHours(new Date(), 1);
          break;
        case '24h':
          startDate = subHours(new Date(), 24);
          break;
        case '7d':
          startDate = subDays(new Date(), 7);
          break;
      }

      // Dapatkan jumlah pengguna aktif dalam jendela waktu
      const activeUserRecord = await prisma.activeUserCount.findFirst({
        where: {
          projectId,
          timeWindow,
          timestamp: {
            gte: startDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      // Default ke 100 jika tidak ada data
      const totalUsers = {
        '1h': activeUserRecord?.userCount || 100,
        '24h': activeUserRecord?.userCount || 100,
        '7d': activeUserRecord?.userCount || 100
      };

      // Query untuk mendapatkan error groups dan menghitung unique users
      const whereClause: any = {
        projectId,
        timestamp: {
          gte: startDate
        },
        userContext: {
          path: ['userId'],
          not: null
        }
      };

      // Filter untuk group tertentu jika errorGroupId diberikan
      if (errorGroupId) {
        whereClause.groupId = errorGroupId;
      }

      // Dapatkan data event untuk analisis
      const events = await prisma.event.findMany({
        where: whereClause,
        select: {
          groupId: true,
          userContext: true,
          timestamp: true,
          group: {
            select: {
              id: true,
              errorType: true,
              message: true
            }
          }
        }
      });

      // Group event berdasarkan errorGroupId
      const errorGroups: Record<string, {
        errorGroupId: string;
        errorType: string;
        message: string;
        users: Set<string>;
        usersLastHour: Set<string>;
        usersLastDay: Set<string>;
        usersLastWeek: Set<string>;
      }> = {};

      const oneHourAgo = subHours(new Date(), 1);
      const oneDayAgo = subHours(new Date(), 24);
      
      events.forEach(event => {
        if (!event.groupId || !event.group) return;
        
        const { groupId, userContext, timestamp } = event;
        
        // Pastikan userContext adalah objek dan memiliki userId
        if (!userContext || typeof userContext !== 'object' || !('userId' in userContext)) return;
        
        // Type casting dari JSON ke objek dengan userId
        const userId = (userContext as { userId: string }).userId;
        
        if (!userId) return;

        if (!errorGroups[groupId]) {
          errorGroups[groupId] = {
            errorGroupId: groupId,
            errorType: event.group.errorType,
            message: event.group.message,
            users: new Set(),
            usersLastHour: new Set(),
            usersLastDay: new Set(),
            usersLastWeek: new Set()
          };
        }

        // Tambahkan userId ke set yang sesuai
        errorGroups[groupId].users.add(userId);
        
        if (timestamp >= oneHourAgo) {
          errorGroups[groupId].usersLastHour.add(userId);
        }
        
        if (timestamp >= oneDayAgo) {
          errorGroups[groupId].usersLastDay.add(userId);
        }
        
        // Semua masuk ke usersLastWeek karena startDate sudah difilter
        errorGroups[groupId].usersLastWeek.add(userId);
      });

      // Konversi ke array dan hitung persentase dampak
      const result: UserImpact[] = Object.values(errorGroups).map(group => {
        const impactLastHour = group.usersLastHour.size / totalUsers['1h'] * 100;
        const impactLastDay = group.usersLastDay.size / totalUsers['24h'] * 100;
        const impactLastWeek = group.usersLastWeek.size / totalUsers['7d'] * 100;
        
        // Update nilai impact di database
        prisma.errorGroup.update({
          where: { id: group.errorGroupId },
          data: {
            userImpactLastHour: impactLastHour,
            userImpactLastDay: impactLastDay,
            userImpactLastWeek: impactLastWeek
          }
        }).catch(err => console.error('Error updating impact metrics:', err));
        
        return {
          errorGroupId: group.errorGroupId,
          errorType: group.errorType,
          message: group.message,
          impactLastHour,
          impactLastDay,
          impactLastWeek,
          totalUsersLastHour: totalUsers['1h'],
          totalUsersLastDay: totalUsers['24h'],
          totalUsersLastWeek: totalUsers['7d']
        };
      });

      // Urutkan berdasarkan dampak per jam tertinggi
      return result.sort((a, b) => b.impactLastHour - a.impactLastHour);
    } catch (error) {
      console.error('Error calculating user impact:', error);
      throw error;
    }
  }

  /**
   * Update jumlah pengguna aktif untuk digunakan dalam perhitungan dampak
   */
  async updateActiveUserCount(
    projectId: string,
    timeWindow: '1h' | '24h' | '7d',
    userCount: number
  ): Promise<void> {
    try {
      await prisma.activeUserCount.upsert({
        where: {
          projectId_timeWindow_timestamp: {
            projectId,
            timeWindow,
            timestamp: new Date()
          }
        },
        update: {
          userCount
        },
        create: {
          projectId,
          timeWindow,
          userCount,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating active user count:', error);
      // Jangan throw error, karena ini operasi non-kritis
    }
  }
} 