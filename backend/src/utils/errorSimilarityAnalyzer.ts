import prisma from '../models/prisma';
import { parseStackTrace } from './stackTraceParser';

/**
 * Interface untuk hasil perbandingan error
 */
interface ErrorSimilarity {
  errorId: string;
  groupId: string;
  errorType: string;
  message: string;
  similarityScore: number; // 0-1 dengan 1 adalah identik
  commonFrames: number;
  timestamp: Date;
}

/**
 * Algoritma untuk menghitung jarak Levenshtein antara dua string
 * Digunakan untuk membandingkan pesan error
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Inisialisasi matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  // Isi matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Menghitung similaritas antara dua string dengan algoritma Levenshtein
 * Hasil berupa nilai 0-1 di mana 1 adalah identik
 */
function calculateStringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  
  if (maxLength === 0) return 1;
  
  return 1 - distance / maxLength;
}

/**
 * Bandingkan dua stack frame untuk mencari kesamaan
 */
function compareFrames(frameA: any, frameB: any): number {
  if (!frameA || !frameB) return 0;
  
  let score = 0;
  
  // Bandingkan nama file
  if (frameA.fileName === frameB.fileName) {
    score += 0.4;
  } else {
    // Partial match untuk nama file
    const fileNameSimilarity = calculateStringSimilarity(frameA.fileName, frameB.fileName);
    score += fileNameSimilarity * 0.2;
  }
  
  // Bandingkan nomor baris (jika baris sama, tambah skor)
  if (frameA.lineNumber === frameB.lineNumber) {
    score += 0.3;
  } else {
    // Jika baris berdekatan (toleransi +/- 5 baris)
    const lineDiff = Math.abs(frameA.lineNumber - frameB.lineNumber);
    if (lineDiff <= 5) {
      score += 0.2 * (1 - lineDiff / 5);
    }
  }
  
  // Bandingkan nama fungsi jika ada
  if (frameA.functionName && frameB.functionName) {
    if (frameA.functionName === frameB.functionName) {
      score += 0.3;
    } else {
      const functionSimilarity = calculateStringSimilarity(frameA.functionName, frameB.functionName);
      score += functionSimilarity * 0.2;
    }
  }
  
  return score;
}

/**
 * Menghitung kemiripan stack trace antara dua error
 */
function calculateStackTraceSimilarity(stackTraceA: string, stackTraceB: string): {
  similarity: number;
  commonFrames: number;
} {
  if (!stackTraceA || !stackTraceB) {
    return { similarity: 0, commonFrames: 0 };
  }
  
  // Parse stack trace
  const framesA = parseStackTrace(stackTraceA);
  const framesB = parseStackTrace(stackTraceB);
  
  if (framesA.length === 0 || framesB.length === 0) {
    return { similarity: 0, commonFrames: 0 };
  }
  
  // Ambil maksimal 10 frame teratas
  const topFramesA = framesA.slice(0, 10);
  const topFramesB = framesB.slice(0, 10);
  
  let totalScore = 0;
  let commonFrames = 0;
  
  // Bandingkan frame per frame
  for (let i = 0; i < Math.min(topFramesA.length, topFramesB.length); i++) {
    const frameScore = compareFrames(topFramesA[i], topFramesB[i]);
    
    if (frameScore > 0.7) { // Jika frame cukup mirip
      commonFrames++;
    }
    
    totalScore += frameScore;
  }
  
  // Hitung rata-rata
  const maxFrames = Math.max(topFramesA.length, topFramesB.length);
  const similarity = totalScore / maxFrames;
  
  return { similarity, commonFrames };
}

/**
 * Menghitung kesamaan antara dua error berdasarkan berbagai faktor
 */
function calculateErrorSimilarity(
  errorA: { errorType: string; message: string; stacktrace: string | null },
  errorB: { errorType: string; message: string; stacktrace: string | null }
): { similarityScore: number; commonFrames: number } {
  // Bobot untuk tiap faktor perbandingan
  const weights = {
    errorType: 0.25,
    message: 0.35,
    stackTrace: 0.4
  };
  
  // Bandingkan tipe error (exact match)
  const errorTypeSimilarity = errorA.errorType === errorB.errorType ? 1 : 0;
  
  // Bandingkan pesan error menggunakan Levenshtein
  const messageSimilarity = calculateStringSimilarity(errorA.message, errorB.message);
  
  // Bandingkan stack trace
  const { similarity: stackTraceSimilarity, commonFrames } = calculateStackTraceSimilarity(
    errorA.stacktrace || '',
    errorB.stacktrace || ''
  );
  
  // Hitung skor akhir dengan pembobotan
  const similarityScore = 
    (errorTypeSimilarity * weights.errorType) +
    (messageSimilarity * weights.message) +
    (stackTraceSimilarity * weights.stackTrace);
  
  return { similarityScore, commonFrames };
}

/**
 * Mencari error yang mirip dengan error tertentu
 */
export async function findSimilarErrors(
  eventId: string,
  threshold: number = 0.7,
  limit: number = 10
): Promise<ErrorSimilarity[]> {
  try {
    // Ambil error yang akan dijadikan referensi
    const targetEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: {
          select: {
            id: true,
            errorType: true,
            message: true,
            events: {
              select: { id: true },
              take: 1
            }
          }
        }
      }
    });
    
    if (!targetEvent) {
      throw new Error('Event tidak ditemukan');
    }
    
    // Ambil project ID untuk membatasi pencarian dalam project yang sama
    const projectId = targetEvent.projectId;
    
    // Ambil semua grup error dari project yang sama
    // Kecuali grup yang sama dengan target
    const errorGroups = await prisma.errorGroup.findMany({
      where: {
        projectId,
        id: { not: targetEvent.groupId || '' },
      },
      include: {
        events: {
          take: 1, // Ambil 1 event untuk tiap grup
          orderBy: { timestamp: 'desc' }
        }
      },
      take: 50 // Batasi pencarian untuk performa
    });
    
    const similarErrors: ErrorSimilarity[] = [];
    
    // Bandingkan dengan setiap grup error
    for (const group of errorGroups) {
      if (group.events.length === 0) continue;
      
      const representativeEvent = group.events[0];
      
      // Hitung similaritas
      const { similarityScore, commonFrames } = calculateErrorSimilarity(
        {
          errorType: targetEvent.errorType,
          message: targetEvent.message,
          stacktrace: targetEvent.stacktrace
        },
        {
          errorType: group.errorType,
          message: group.message,
          stacktrace: representativeEvent.stacktrace
        }
      );
      
      // Tambahkan ke hasil jika di atas threshold
      if (similarityScore >= threshold) {
        similarErrors.push({
          errorId: representativeEvent.id,
          groupId: group.id,
          errorType: group.errorType,
          message: group.message,
          similarityScore,
          commonFrames,
          timestamp: representativeEvent.timestamp
        });
      }
    }
    
    // Urutkan berdasarkan skor similaritas (tertinggi ke terendah)
    similarErrors.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Batasi hasil
    return similarErrors.slice(0, limit);
  } catch (error) {
    console.error('Error finding similar errors:', error);
    throw error;
  }
}

/**
 * Menemukan error yang sering terjadi bersamaan (co-occurring errors)
 */
export async function findCoOccurringErrors(
  groupId: string,
  timeWindowMinutes: number = 60,
  limit: number = 10
): Promise<{ groupId: string; errorType: string; message: string; count: number; percentage: number }[]> {
  try {
    // Ambil informasi grup error
    const errorGroup = await prisma.errorGroup.findUnique({
      where: { id: groupId },
      select: { id: true, projectId: true }
    });
    
    if (!errorGroup) {
      throw new Error('Error group tidak ditemukan');
    }
    
    // Ambil semua event dari grup ini dalam 30 hari terakhir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const events = await prisma.event.findMany({
      where: {
        groupId,
        timestamp: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        id: true,
        timestamp: true,
        userContext: true // untuk mengidentifikasi user yang sama
      },
      orderBy: { timestamp: 'asc' }
    });
    
    // Track user session untuk mencari error yang terjadi dalam rentang waktu berdekatan
    const coOccurrences: Map<string, number> = new Map();
    const totalOccurrences = events.length;
    
    for (const event of events) {
      const userContextObj = event.userContext as Record<string, any> | null;
      const userId = userContextObj?.userId as string | undefined;
      if (!userId) continue;
      
      // Tentukan rentang waktu untuk co-occurring error
      const timeWindowStart = new Date(event.timestamp);
      timeWindowStart.setMinutes(timeWindowStart.getMinutes() - timeWindowMinutes);
      
      const timeWindowEnd = new Date(event.timestamp);
      timeWindowEnd.setMinutes(timeWindowEnd.getMinutes() + timeWindowMinutes);
      
      // Cari event lain yang terjadi dalam rentang waktu tersebut oleh user yang sama
      const coOccurringEvents = await prisma.event.findMany({
        where: {
          projectId: errorGroup.projectId,
          groupId: { not: groupId }, // Jangan masukkan grup yang sama
          timestamp: {
            gte: timeWindowStart,
            lte: timeWindowEnd
          },
          userContext: {
            path: ['userId'],
            equals: userId
          }
        },
        select: {
          groupId: true
        }
      });
      
      // Count occurrence
      for (const coEvent of coOccurringEvents) {
        if (!coEvent.groupId) continue;
        
        const count = coOccurrences.get(coEvent.groupId) || 0;
        coOccurrences.set(coEvent.groupId, count + 1);
      }
    }
    
    // Convert to array and calculate percentage
    const result = await Promise.all(
      Array.from(coOccurrences.entries())
        .map(async ([coGroupId, count]) => {
          const coGroup = await prisma.errorGroup.findUnique({
            where: { id: coGroupId },
            select: { errorType: true, message: true }
          });
          
          if (!coGroup) return null;
          
          return {
            groupId: coGroupId,
            errorType: coGroup.errorType,
            message: coGroup.message,
            count,
            percentage: totalOccurrences > 0 ? (count / totalOccurrences) * 100 : 0
          };
        })
    );
    
    // Filter out nulls, sort by count (descending) and limit results
    return result
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error finding co-occurring errors:', error);
    throw error;
  }
} 