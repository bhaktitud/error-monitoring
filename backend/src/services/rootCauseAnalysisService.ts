import prisma from '../models/prisma';
import { parseStackTrace } from '../utils/stackTraceParser';
import { transformStackTrace } from '../utils/sourcemap';

/**
 * Interface untuk hasil analisis akar masalah
 */
export interface RootCauseResult {
  id: string;
  eventId: string;
  groupId: string;
  analyzedAt: Date;
  probableCauses: Array<{
    cause: string;
    probability: number;
    explanation: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    codeExample?: string;
  }>;
  relatedDeployments: string[];
  detailedAnalysis: {
    stackFrames: Array<{
      fileName: string;
      lineNumber: number;
      columnNumber?: number;
      functionName?: string;
      isSourceMapped: boolean;
      originalFileName?: string;
      originalLineNumber?: number;
      originalColumnNumber?: number;
      sourceCode?: string;
    }>;
    systemConditions: Record<string, unknown>;
    relatedEvents: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingTime?: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mencari analisis akar masalah yang sudah ada untuk event tertentu
 */
export async function findRootCauseAnalysis(eventId: string) {
  return prisma.rootCauseAnalysis.findUnique({
    where: { eventId }
  });
}

/**
 * Memulai analisis akar masalah untuk event tertentu
 */
export async function initiateRootCauseAnalysis(eventId: string) {
  // Cek apakah event ada
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event) {
    throw new Error('Event tidak ditemukan');
  }

  // Cek apakah sudah ada analisis untuk event ini
  const existingAnalysis = await findRootCauseAnalysis(eventId);
  if (existingAnalysis) {
    return existingAnalysis;
  }

  // Buat entri analisis baru dengan status 'pending'
  const analysis = await prisma.rootCauseAnalysis.create({
    data: {
      eventId,
      groupId: event.groupId || '',
      status: 'pending',
      probableCauses: [],
      recommendations: [],
      relatedDeployments: [],
      stackFrames: [],
      systemConditions: {},
      relatedEvents: []
    }
  });

  // Mulai proses analisis secara asynchronous
  processRootCauseAnalysis(analysis.id)
    .catch(err => console.error('Error processing root cause analysis:', err));

  return analysis;
}

/**
 * Memproses analisis akar masalah secara asynchronous
 */
export async function processRootCauseAnalysis(analysisId: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Ambil data analisis
    const analysis = await prisma.rootCauseAnalysis.findUnique({
      where: { id: analysisId }
    });

    if (!analysis) {
      throw new Error('Analisis tidak ditemukan');
    }

    // Update status
    await prisma.rootCauseAnalysis.update({
      where: { id: analysisId },
      data: { status: 'processing' }
    });

    // Ambil data event
    const event = await prisma.event.findUnique({
      where: { id: analysis.eventId }
    });

    if (!event) {
      throw new Error('Event tidak ditemukan');
    }

    // Proses stack trace
    let stackFrames = event.stacktrace ? parseStackTrace(event.stacktrace) : [];
    
    // Coba source map menggunakan release jika tersedia
    if (event.release && stackFrames.length > 0) {
      try {
        // Dapatkan project ID dari event
        const project = await prisma.project.findUnique({
          where: { id: event.projectId },
          select: { id: true }
        });
        
        if (project) {
          // Transform stack trace menggunakan source map
          const transformedStackTrace = await transformStackTrace(
            project.id,
            event.release,
            event.stacktrace || '',
            event.environment || undefined
          );
          
          // Parse hasil transformasi
          const transformedFrames = parseStackTrace(transformedStackTrace);
          
          // Jika berhasil mentransformasi
          if (transformedFrames.length > 0) {
            // Simpan informasi stack trace asli dan hasil transformasi
            stackFrames = stackFrames.map((frame, idx) => {
              const transformedFrame = transformedFrames[idx];
              if (transformedFrame) {
                return {
                  ...frame,
                  isSourceMapped: true,
                  originalFileName: transformedFrame.fileName,
                  originalLineNumber: transformedFrame.lineNumber,
                  originalColumnNumber: transformedFrame.columnNumber
                };
              }
              return { ...frame, isSourceMapped: false };
            });
          }
        }
      } catch (mapError) {
        console.error('Error sourcing mapping stack trace:', mapError);
        // Lanjutkan dengan stack frames yang asli jika terjadi error
      }
    }
    
    // Coba temukan source map berdasarkan file
    const detailedStackFrames = await Promise.all(
      stackFrames.map(async (frame) => {
        // Coba dapatkan source code untuk frame ini (tahap 2 improvement)
        if (frame.isSourceMapped && frame.originalFileName) {
          try {
            // Di tahap selanjutnya, tambahkan code untuk mendapatkan source code
            // dari file yang di-source mapped
          } catch (sourceError) {
            console.error('Error getting source code:', sourceError);
          }
        }
        return frame;
      })
    );
    
    // Tahap 1: Hanya implementasi dasar untuk mengekstrak info dari stack trace
    const probableCauses = [{
      cause: 'Unhandled Exception',
      probability: 0.8,
      explanation: `Error terjadi pada ${event.errorType}: ${event.message}`
    }];

    // Jika ada stack trace yang di-source map, tambahkan penyebab lebih detail
    if (detailedStackFrames.some(frame => frame.isSourceMapped)) {
      probableCauses.push({
        cause: 'Source Code Issue',
        probability: 0.7,
        explanation: `Masalah terdeteksi di sumber asli: ${detailedStackFrames[0]?.originalFileName || 'Unknown'} baris ${detailedStackFrames[0]?.originalLineNumber || 'Unknown'}`
      });
    }

    // Rekomendasi dasar
    const recommendations = [{
      action: 'Review Code',
      priority: 'high' as const,
      description: `Periksa kode di lokasi error: ${detailedStackFrames[0]?.fileName || 'Unknown file'}:${detailedStackFrames[0]?.lineNumber || 'Unknown line'}`
    }];

    // Tambahkan rekomendasi berdasarkan source map
    if (detailedStackFrames.some(frame => frame.isSourceMapped)) {
      recommendations.push({
        action: 'Check Original Source',
        priority: 'high' as const,
        description: `Tinjau kode sumber asli di: ${detailedStackFrames[0]?.originalFileName || 'Unknown'}:${detailedStackFrames[0]?.originalLineNumber || 'Unknown'}`
      });
    }

    // Mencari event terkait dalam grup yang sama
    const relatedEvents = await prisma.event.findMany({
      where: {
        groupId: analysis.groupId,
        id: { not: analysis.eventId }
      },
      orderBy: { 
        timestamp: 'desc' 
      },
      take: 5,
      select: { id: true }
    });

    // Update analisis dengan hasil
    await prisma.rootCauseAnalysis.update({
      where: { id: analysisId },
      data: {
        probableCauses: JSON.stringify(probableCauses),
        recommendations: JSON.stringify(recommendations),
        stackFrames: JSON.stringify(detailedStackFrames),
        systemConditions: JSON.stringify({
          browser: event.browser,
          os: event.os,
          deviceType: event.deviceType,
          environment: event.environment,
          release: event.release
        }),
        relatedEvents: relatedEvents.map(e => e.id),
        status: 'completed',
        processingTime: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error('Error in root cause analysis:', error);
    
    // Update status jika terjadi error
    try {
      await prisma.rootCauseAnalysis.update({
        where: { id: analysisId },
        data: {
          status: 'failed',
          processingTime: Date.now() - startTime
        }
      });
    } catch (updateError) {
      console.error('Failed to update analysis status:', updateError);
    }
  }
}

/**
 * Format hasil analisis untuk API response
 */
export function formatRootCauseAnalysis(analysis: any): RootCauseResult {
  return {
    id: analysis.id,
    eventId: analysis.eventId,
    groupId: analysis.groupId,
    analyzedAt: analysis.analyzedAt,
    probableCauses: analysis.probableCauses || [],
    recommendations: analysis.recommendations || [],
    relatedDeployments: analysis.relatedDeployments || [],
    detailedAnalysis: {
      stackFrames: analysis.stackFrames || [],
      systemConditions: analysis.systemConditions || {},
      relatedEvents: analysis.relatedEvents || []
    },
    status: analysis.status,
    processingTime: analysis.processingTime,
    version: analysis.version,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt
  };
} 