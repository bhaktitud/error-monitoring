import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { ErrorInsightService } from './errorInsightService';

const prisma = new PrismaClient();
const errorInsightService = new ErrorInsightService();

export class ErrorGroupingService {
  // Method untuk mengelompokkan error dan mengembalikan errorGroup dan isNewGroup
  async groupError(errorData: {
    projectId: string;
    errorType: string;
    message: string;
    stacktrace?: string;
    statusCode?: number;
    userAgent?: string;
    userContext?: any;
    tags?: any;
    url?: string;
    browser?: string;
    os?: string;
  }): Promise<{
    errorGroup: {
      id: string;
      fingerprint: string;
      errorType: string;
      message: string;
      count: number;
      firstSeen: Date;
      lastSeen: Date;
      status: string;
      statusCode: number | null;
      code: string;
    };
    isNewGroup: boolean;
  }> {
    try {
      // Generate fingerprint untuk error
      const fingerprint = this.generateFingerprint(errorData);
      
      // Cek apakah grup error sudah ada berdasarkan fingerprint
      let errorGroup = await prisma.errorGroup.findUnique({
        where: {
          projectId_fingerprint: {
            projectId: errorData.projectId,
            fingerprint: fingerprint,
          },
        },
      });
      
      let isNewGroup = false;
      
      if (errorGroup) {
        // Grup sudah ada, update count dan lastSeen
        errorGroup = await prisma.errorGroup.update({
          where: { id: errorGroup.id },
          data: {
            count: { increment: 1 },
            lastSeen: new Date(),
            // Hanya update status ke 'open' jika sebelumnya resolved
            // Jika ignored tetap ignored
            status: errorGroup.status === 'resolved' ? 'open' : undefined,
          },
        });

        // Jika errorGroup lama tidak memiliki kode, tambahkan
        if (!errorGroup.code) {
          const code = this.generateErrorGroupCode();
          await prisma.errorGroup.update({
            where: { id: errorGroup.id },
            data: { code }
          });
          errorGroup.code = code;
        }
      } else {
        // Grup belum ada, buat baru
        errorGroup = await prisma.errorGroup.create({
          data: {
            projectId: errorData.projectId,
            fingerprint: fingerprint,
            errorType: errorData.errorType,
            message: errorData.message || 'No message',
            count: 1,
            firstSeen: new Date(),
            lastSeen: new Date(),
            status: 'open',
            statusCode: errorData.statusCode || null,
            code: this.generateErrorGroupCode(),
            userImpactLastHour: 0,
            userImpactLastDay: 0,
            userImpactLastWeek: 0
          },
        });
        isNewGroup = true;
      }

      // Menyiapkan objek yang sesuai dengan tipe kembalian
      const result = {
        id: errorGroup.id,
        fingerprint: errorGroup.fingerprint,
        errorType: errorGroup.errorType,
        message: errorGroup.message,
        count: errorGroup.count,
        firstSeen: errorGroup.firstSeen,
        lastSeen: errorGroup.lastSeen,
        status: errorGroup.status,
        statusCode: errorGroup.statusCode,
        code: errorGroup.code
      };
      
      // Proses error sequence untuk error correlation
      try {
        // Ekstrak userId dan sessionId dari userContext
        let userId = null;
        let sessionId = null;

        if (errorData.userContext) {
          // Extract userId if it exists
          if (errorData.userContext.userId) {
            userId = errorData.userContext.userId;
          }
          
          // Extract sessionId if it exists
          if (errorData.userContext.sessionId) {
            sessionId = errorData.userContext.sessionId;
          }
        }
        
        // Catat error sequence secara asynchronous (jangan menunggu hasil)
        if (userId || sessionId) {
          errorInsightService.recordErrorSequence(
            errorData.projectId,
            userId,
            errorGroup.id,
            sessionId
          ).catch(err => console.error('Failed to record error sequence:', err));
          
          // Jika batas waktu tertentu sudah lewat, kalkulasi ulang user impact
          if (isNewGroup || this.shouldUpdateUserImpact(errorGroup.lastSeen)) {
            errorInsightService.calculateUserImpact(
              errorData.projectId, 
              errorGroup.id
            ).catch(err => console.error('Failed to calculate user impact:', err));
          }
        }
      } catch (err) {
        // Jangan gagalkan operasi utama jika insight gagal
        console.error('Error processing insight data:', err);
      }
      
      return { errorGroup: result, isNewGroup };
    } catch (error: unknown) {
      console.error('Error in grouping error:', error);
      throw new Error(`Failed to group error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Method untuk menghasilkan fingerprint error (deduplication)
  private generateFingerprint(errorData: {
    errorType: string;
    message: string;
    stacktrace?: string;
    url?: string;
  }): string {
    // Implementasi algoritma fingerprinting
    // Ini adalah implementasi sederhana, bisa dikembangkan lebih lanjut
    
    try {
      // 1. Extract method name dan line number dari stacktrace jika ada
      let stackFrame = this.extractMainStackFrame(errorData.stacktrace || '');
      
      // 2. Normalisasi pesan error (hapus nilai dinamis seperti ID, timestamp)
      const normalizedMessage = this.normalizeErrorMessage(errorData.message || '');
      
      // 3. Kombinasikan informasi penting untuk fingerprint
      // Prioritas: errorType > stackFrame > normalizedMessage > url path
      const fingerprintData = [
        errorData.errorType,
        stackFrame,
        normalizedMessage,
        this.extractUrlPath(errorData.url || '')
      ].filter(Boolean).join('|');
      
      // 4. Hashing untuk mendapatkan fingerprint yang konsisten
      return crypto.createHash('sha256').update(fingerprintData).digest('hex');
    } catch (error) {
      console.error('Error generating fingerprint:', error);
      // Fallback ke simple hash dari error type dan message
      const fallbackData = `${errorData.errorType}|${errorData.message}`;
      return crypto.createHash('md5').update(fallbackData).digest('hex');
    }
  }
  
  // Extract informasi paling penting dari stacktrace
  private extractMainStackFrame(stacktrace: string): string {
    if (!stacktrace) return '';
    
    try {
      // Split stacktrace menjadi lines
      const lines = stacktrace.split('\n');
      
      // Cari frame yang bukan dari node_modules, library, atau internal
      const appFrames = lines.filter(line => {
        const excludePatterns = [
          'node_modules',
          'internal/',
          '<anonymous>',
          'webpack://',
          'at Module.',
          'at Object.',
          'at Function.',
          'at Object.exports',
          'at __webpack_require__',
          'node:',
        ];
        
        const hasExcludePattern = excludePatterns.some(pattern => 
          line.includes(pattern)
        );
        
        return line.trim().startsWith('at ') && !hasExcludePattern;
      });
      
      // Ambil first app frame atau first stack frame jika tidak ada app frame
      const mainFrame = appFrames.length > 0 
        ? appFrames[0] 
        : (lines.length > 1 ? lines[1] : lines[0]); // Skip Error: message
      
      // Extract file, function dan location
      const atMatch = mainFrame.match(/at\s+(.*)/);
      if (!atMatch) return mainFrame.trim();
      
      const framePart = atMatch[1];
      
      // Extract function name if exists (before the file/location part)
      let funcNameMatch = framePart.match(/(.*)\s+\((.*):(\d+):(\d+)\)/);
      
      if (funcNameMatch) {
        // Format: "functionName (file:line:column)"
        const [_, funcName, file, line, column] = funcNameMatch;
        return `${this.getFileName(file)}:${line}:${funcName}`;
      } else {
        // Format: "file:line:column"
        funcNameMatch = framePart.match(/(.*):(\d+):(\d+)/);
        if (funcNameMatch) {
          const [_, file, line, column] = funcNameMatch;
          return `${this.getFileName(file)}:${line}`;
        }
      }
      
      return mainFrame.trim();
    } catch (error) {
      console.error('Error extracting stack frame:', error);
      return stacktrace.split('\n')[0] || '';
    }
  }
  
  // Extract filename dari path
  private getFileName(filePath: string): string {
    try {
      // Hapus URL/webpack prefix
      let path = filePath.replace(/^(webpack:\/\/|file:\/\/|https?:\/\/[^/]+\/)/, '');
      
      // Extract only the filename.ext part
      const parts = path.split('/');
      return parts[parts.length - 1];
    } catch {
      return filePath;
    }
  }
  
  // Normalize error message dengan menghapus data dinamis
  private normalizeErrorMessage(message: string): string {
    if (!message) return '';
    
    try {
      // 1. Hapus UUID/ID patterns
      let normalized = message.replace(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, 
        '[ID]'
      );
      
      // 2. Hapus timestamps
      normalized = normalized.replace(
        /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:T| )\d{1,2}:\d{1,2}:\d{1,2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?\b/g, 
        '[TIMESTAMP]'
      );
      
      // 3. Normalize angka dengan banyak digit (likely ID atau timestamp)
      normalized = normalized.replace(/\b\d{5,}\b/g, '[NUMBER]');
      
      // 4. Normalize quotes content jika terlalu spesifik
      normalized = normalized.replace(/"([^"]{20,})"/g, '"[CONTENT]"');
      normalized = normalized.replace(/'([^']{20,})'/g, "'[CONTENT]'");
      
      return normalized;
    } catch (error) {
      console.error('Error normalizing message:', error);
      return message;
    }
  }
  
  // Extract path dari URL
  private extractUrlPath(url: string): string {
    if (!url) return '';
    
    try {
      // Parse URL dan extract pathname
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // URL invalid, skip
      return '';
    }
  }
  
  // Menghasilkan kode unik untuk error group
  private generateErrorGroupCode(): string {
    // Format: ERG-[6 karakter acak]-[timestamp 3 digit]
    const randomPart = crypto.randomBytes(3).toString('hex');
    const timestampPart = Math.floor(Date.now() % 1000).toString().padStart(3, '0');
    return `ERG-${randomPart}-${timestampPart}`;
  }
  
  // Menghasilkan kode unik untuk event
  private generateEventCode(): string {
    // Format: EVT-[6 karakter acak]-[timestamp 3 digit]
    const randomPart = crypto.randomBytes(3).toString('hex');
    const timestampPart = Math.floor(Date.now() % 1000).toString().padStart(3, '0');
    return `EVT-${randomPart}-${timestampPart}`;
  }
  
  // Metode untuk mendapatkan ErrorGroup dengan paginasi
  async getErrorGroups(projectId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'lastSeen',
      sortOrder = 'desc'
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Build the where clause
    let where: any = { projectId };
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { errorType: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count for pagination
    const total = await prisma.errorGroup.count({ where });
    
    // Build the order object
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get error groups with pagination
    const errorGroups = await prisma.errorGroup.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        assignee: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    
    return {
      errorGroups,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  // Metode untuk mendapatkan detail ErrorGroup dengan event terkait
  async getErrorGroupDetail(groupId: string, options: {
    eventLimit?: number;
    eventPage?: number;
  } = {}) {
    const { eventLimit = 10, eventPage = 1 } = options;
    const eventSkip = (eventPage - 1) * eventLimit;
    
    const errorGroup = await prisma.errorGroup.findUnique({
      where: { id: groupId },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true, 
                email: true,
                avatar: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        comments: {
          include: {
            author: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            events: true
          }
        }
      }
    });
    
    if (!errorGroup) {
      throw new Error('Error group not found');
    }
    
    // Get events dengan pagination
    const events = await prisma.event.findMany({
      where: { groupId },
      orderBy: { timestamp: 'desc' },
      skip: eventSkip,
      take: eventLimit
    });
    
    return {
      ...errorGroup,
      events,
      eventPagination: {
        total: errorGroup._count.events,
        page: eventPage,
        limit: eventLimit,
        totalPages: Math.ceil(errorGroup._count.events / eventLimit)
      }
    };
  }
  
  // Metode untuk mengupdate status ErrorGroup
  async updateErrorGroupStatus(groupId: string, status: 'open' | 'resolved' | 'ignored') {
    return prisma.errorGroup.update({
      where: { id: groupId },
      data: { status }
    });
  }
  
  // Metode untuk meng-assign ErrorGroup ke member project
  async assignErrorGroup(groupId: string, memberId: string | null) {
    return prisma.errorGroup.update({
      where: { id: groupId },
      data: { assignedTo: memberId }
    });
  }
  
  // Metode untuk menambahkan komentar ke ErrorGroup
  async addComment(groupId: string, memberId: string, content: string) {
    return prisma.errorGroupComment.create({
      data: {
        groupId,
        authorId: memberId,
        content
      },
      include: {
        author: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });
  }
  
  // Metode untuk mendapatkan statistik error berdasarkan project
  async getErrorStats(projectId: string, timeframe: 'day' | 'week' | 'month' = 'day') {
    let startDate: Date;
    const now = new Date();
    
    // Set startDate berdasarkan timeframe
    switch (timeframe) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    // Count errors by status
    const statusCount = await prisma.errorGroup.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true
    });
    
    // Get error groups created since startDate
    const newErrors = await prisma.errorGroup.count({
      where: {
        projectId,
        firstSeen: { gte: startDate }
      }
    });
    
    // Get error groups updated since startDate
    const recentErrors = await prisma.errorGroup.count({
      where: {
        projectId,
        lastSeen: { gte: startDate }
      }
    });
    
    // Get total error events since startDate
    const totalEvents = await prisma.event.count({
      where: {
        projectId,
        timestamp: { gte: startDate }
      }
    });
    
    // Format status counts
    const byStatus = statusCount.reduce((acc, curr) => {
      const status = curr.status as keyof typeof acc;
      acc[status] = curr._count;
      return acc;
    }, {
      open: 0,
      resolved: 0,
      ignored: 0
    });
    
    return {
      statusCounts: byStatus,
      newGroups: newErrors,
      recentGroups: recentErrors,
      totalEvents,
      timeframe
    };
  }
  
  // Tentukan apakah perlu update user impact metrics (batasi update untuk menghemat resource)
  private shouldUpdateUserImpact(lastUpdate: Date): boolean {
    // Update jika terakhir update lebih dari 1 jam yang lalu
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastUpdate < oneHourAgo;
  }
} 