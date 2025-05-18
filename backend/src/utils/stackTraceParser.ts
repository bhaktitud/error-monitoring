/**
 * Utility untuk parsing stack trace dari berbagai format
 */

interface StackFrame {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  functionName?: string;
  isSourceMapped: boolean;
  originalFileName?: string;
  originalLineNumber?: number;
  originalColumnNumber?: number;
  sourceCode?: string;
}

/**
 * Parse stack trace string menjadi array frame terstruktur
 */
export function parseStackTrace(stackTrace: string): StackFrame[] {
  if (!stackTrace) {
    return [];
  }

  const frames: StackFrame[] = [];
  
  // Coba parse beberapa format stack trace umum
  
  // Format 1: Chrome/V8
  // at Function.Module._load (internal/modules/cjs/loader.js:807:14)
  const chromeRegex = /at\s+(.*)\s+\((.*):(\d+):(\d+)\)|at\s+()(.*):(\d+):(\d+)/g;
  let match: RegExpExecArray | null;
  
  while ((match = chromeRegex.exec(stackTrace)) !== null) {
    const functionName = match[1] || match[5] || 'anonymous';
    const fileName = match[2] || match[6] || '<unknown>';
    const lineNumber = parseInt(match[3] || match[7], 10) || 0;
    const columnNumber = parseInt(match[4] || match[8], 10) || 0;
    
    frames.push({
      functionName,
      fileName,
      lineNumber,
      columnNumber,
      isSourceMapped: false
    });
  }
  
  // Format 2: Firefox
  // functionName@fileName:lineNumber:columnNumber
  if (frames.length === 0) {
    const firefoxRegex = /([^@]*)@(.*):(\d+):(\d+)/g;
    
    while ((match = firefoxRegex.exec(stackTrace)) !== null) {
      const functionName = match[1] || 'anonymous';
      const fileName = match[2] || '<unknown>';
      const lineNumber = parseInt(match[3], 10) || 0;
      const columnNumber = parseInt(match[4], 10) || 0;
      
      frames.push({
        functionName,
        fileName,
        lineNumber,
        columnNumber,
        isSourceMapped: false
      });
    }
  }
  
  // Format 3: Node.js
  // at Object.<anonymous> (/path/to/file.js:123:4)
  if (frames.length === 0) {
    const nodeRegex = /at\s+(.*)\s+\(([^)]+):(\d+):(\d+)\)/g;
    
    while ((match = nodeRegex.exec(stackTrace)) !== null) {
      const functionName = match[1] || 'anonymous';
      const fileName = match[2] || '<unknown>';
      const lineNumber = parseInt(match[3], 10) || 0;
      const columnNumber = parseInt(match[4], 10) || 0;
      
      frames.push({
        functionName,
        fileName,
        lineNumber,
        columnNumber,
        isSourceMapped: false
      });
    }
  }
  
  // Format 4: Generic
  // Jika format lain tidak berhasil, coba ekstrak saja file dan nomor baris
  if (frames.length === 0) {
    const genericRegex = /([^ ]*):(\d+)(?::(\d+))?/g;
    
    while ((match = genericRegex.exec(stackTrace)) !== null) {
      const fileName = match[1] || '<unknown>';
      const lineNumber = parseInt(match[2], 10) || 0;
      const columnNumber = parseInt(match[3], 10) || 0;
      
      frames.push({
        fileName,
        lineNumber,
        columnNumber,
        isSourceMapped: false
      });
    }
  }
  
  // Jika masih tidak berhasil, return frame generik
  if (frames.length === 0) {
    frames.push({
      fileName: '<unknown>',
      lineNumber: 0,
      functionName: 'unknown',
      isSourceMapped: false
    });
  }
  
  return frames;
}

/**
 * Ekstrak informasi penting dari stack trace 
 * Placeholder untuk implementasi yang lebih canggih di tahap selanjutnya
 */
export function extractKeyInfoFromStackTrace(frames: StackFrame[]): {
  mainFile: string;
  mainFunction: string;
  lineNumber: number;
} {
  if (frames.length === 0) {
    return {
      mainFile: '<unknown>',
      mainFunction: 'unknown',
      lineNumber: 0
    };
  }
  
  // Untuk implementasi dasar, pilih frame pertama yang mungkin adalah lokasi error
  const firstFrame = frames[0];
  
  return {
    mainFile: firstFrame.fileName,
    mainFunction: firstFrame.functionName || 'anonymous',
    lineNumber: firstFrame.lineNumber
  };
} 