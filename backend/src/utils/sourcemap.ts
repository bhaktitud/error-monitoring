import { PrismaClient } from '@prisma/client';
import { SourceMapConsumer } from 'source-map';

const prisma = new PrismaClient();

/**
 * Cache untuk source map consumers yang sudah dibuat
 */
const sourceMapCache: Record<string, SourceMapConsumer> = {};

/**
 * Parse baris stack trace untuk mendapatkan informasi file, line, dan column
 */
function parseStackTraceLine(line: string): {
  file: string;
  line: number;
  column: number;
  functionName: string;
} | null {
  // Format umum: "at functionName (file:line:column)"
  const atMatch = line.match(/at\s+(.*)/);
  if (!atMatch) return null;
  
  const framePart = atMatch[1];
  let functionName = '';
  let file = '';
  let lineNum = 0;
  let columnNum = 0;
  
  // Format: "functionName (file:line:column)"
  const funcNameMatch = framePart.match(/(.*)\s+\((.*):(\d+):(\d+)\)/);
  
  if (funcNameMatch) {
    functionName = funcNameMatch[1];
    file = funcNameMatch[2];
    lineNum = parseInt(funcNameMatch[3], 10);
    columnNum = parseInt(funcNameMatch[4], 10);
  } else {
    // Format: "file:line:column"
    const fileMatch = framePart.match(/(.*):(\d+):(\d+)/);
    if (fileMatch) {
      file = fileMatch[1];
      lineNum = parseInt(fileMatch[2], 10);
      columnNum = parseInt(fileMatch[3], 10);
      // Jika tidak ada function name, ambil dari path
      functionName = file.split('/').pop() || '';
    } else {
      return null;
    }
  }
  
  return {
    file,
    line: lineNum,
    column: columnNum,
    functionName
  };
}

/**
 * Mendapatkan source map consumer untuk file tertentu berdasarkan release
 */
async function getSourceMapConsumer(projectId: string, file: string, release?: string): Promise<SourceMapConsumer | null> {
  // Generate unique key untuk cache
  const cacheKey = `${projectId}:${file}:${release || ''}`;
  
  // Cek apakah sudah ada di cache
  if (sourceMapCache[cacheKey]) {
    return sourceMapCache[cacheKey];
  }

  try {
    // Query untuk source map yang sesuai dengan file
    const query: any = {
      projectId,
      isActive: true
    };

    // Coba temukan berdasarkan nama file yang tepat
    let sourceMap = await prisma.sourceMap.findFirst({
      where: {
        ...query,
        sourceFile: file,
        ...(release ? { release } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    // Jika tidak ditemukan, coba dengan minifiedFile
    if (!sourceMap) {
      sourceMap = await prisma.sourceMap.findFirst({
        where: {
          ...query,
          minifiedFile: file,
          ...(release ? { release } : {})
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Jika masih tidak ditemukan, coba cari berdasarkan nama file saja
    if (!sourceMap) {
      const filename = file.split('/').pop();
      if (filename) {
        sourceMap = await prisma.sourceMap.findFirst({
          where: {
            ...query,
            filename,
            ...(release ? { release } : {})
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    }

    if (!sourceMap) {
      return null;
    }

    // Buat source map consumer
    // @ts-ignore - struktur struktur data sedikit berbeda dengan yang diharapkan oleh pustaka source-map
    const consumer = await new SourceMapConsumer(sourceMap.sourceMap);
    
    // Simpan di cache
    sourceMapCache[cacheKey] = consumer;
    
    return consumer;
  } catch (error) {
    console.error('Error getting source map consumer:', error);
    return null;
  }
}

/**
 * Transform stack trace menggunakan source map
 */
export async function transformStackTrace(projectId: string, release: string, stackTrace: string, environment?: string): Promise<string> {
  if (!stackTrace) return stackTrace;
  
  // Tambahkan environment ke query jika disediakan
  const environmentFilter = environment ? { environment } : {};
  
  const lines = stackTrace.split('\n');
  const transformedLines: string[] = [];
  
  // Memproses setiap baris stack trace
  for (const line of lines) {
    // Line pertama biasanya error message, langsung tampilkan
    if (!line.includes('at ')) {
      transformedLines.push(line);
      continue;
    }
    
    const parsedLine = parseStackTraceLine(line);
    if (!parsedLine) {
      transformedLines.push(line);
      continue;
    }
    
    const { file, line: lineNum, column: columnNum, functionName } = parsedLine;
    
    // Coba dapatkan source map consumer untuk file ini
    // Gunakan environment dalam pencarian jika disediakan
    const consumer = await getSourceMapConsumer(projectId, file, release);
    if (!consumer) {
      transformedLines.push(line);
      continue;
    }
    
    // Transformasi menggunakan source map
    const originalPosition = consumer.originalPositionFor({
      line: lineNum,
      column: columnNum
    });
    
    if (originalPosition.source) {
      const originalSource = originalPosition.source.split('/').pop() || originalPosition.source;
      const originalFunction = originalPosition.name || functionName;
      
      transformedLines.push(
        `    at ${originalFunction} (${originalSource}:${originalPosition.line}:${originalPosition.column})`
      );
    } else {
      transformedLines.push(line);
    }
  }
  
  return transformedLines.join('\n');
}

/**
 * Membersihkan cache source map
 */
export function clearSourceMapCache(): void {
  Object.values(sourceMapCache).forEach(consumer => {
    consumer.destroy();
  });
  
  Object.keys(sourceMapCache).forEach(key => {
    delete sourceMapCache[key];
  });
}

// Membersihkan cache secara berkala (setiap 12 jam)
setInterval(clearSourceMapCache, 12 * 60 * 60 * 1000); // 12 jam 