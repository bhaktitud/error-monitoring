import { SourceMapConsumer } from 'source-map';

// Cache untuk source maps yang sudah diambil
const sourceMapCache: Record<string, SourceMapConsumer> = {};
// Cache untuk source map consumers per file
const sourceMapConsumers: Record<string, SourceMapConsumer | null> = {};

// Deteksi lingkungan - browser atau Node.js
const isNodeEnvironment = typeof process !== 'undefined' && 
                         process.versions != null && 
                         process.versions.node != null;

// Import fs dan path jika di lingkungan Node.js
let fs: any;
let path: any;
if (isNodeEnvironment) {
  try {
    fs = require('fs');
    path = require('path');
  } catch (e) {
    console.warn('Failed to load Node.js modules in Node environment');
  }
}

// Tipe untuk hasil transformasi stack trace
interface StackFrameInfo {
  originalFile: string;
  originalLine: number;
  originalColumn: number;
  originalFunction: string;
  compiledFile: string;
  compiledLine: number;
  compiledColumn: number;
  compiledFunction: string;
}

// Interface untuk opsi upload source map
export interface UploadSourceMapOptions {
  dsn: string;
  release: string;
  sourceMap: string | object;
  sourceFile: string;
  minifiedFile?: string;
}

/**
 * Mengambil source map dari URL atau file lokal
 */
async function fetchSourceMap(url: string): Promise<SourceMapConsumer | null> {
  // Cek apakah sudah ada di cache
  if (sourceMapCache[url]) {
    return sourceMapCache[url];
  }

  try {
    let sourceMapData;

    // Pendekatan berbeda untuk Node.js vs browser
    if (isNodeEnvironment && (url.startsWith('/') || url.startsWith('file:'))) {
      // Handle file path di Node.js
      let filePath = url;
      if (url.startsWith('file:')) {
        // Convert file:// URL to file path
        filePath = new URL(url).pathname;
      }
      
      if (!fs.existsSync(filePath)) {
        console.warn(`Source map file not found: ${filePath}`);
        return null;
      }
      
      // Baca file sebagai string
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        sourceMapData = JSON.parse(content);
      } catch (e) {
        console.error(`Invalid source map JSON in ${filePath}`);
        return null;
      }
    } else {
      // Menggunakan fetch di browser atau untuk URL http/https di Node.js
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch source map: ${response.statusText}`);
      }
      sourceMapData = await response.json();
    }

    const consumer = await new SourceMapConsumer(sourceMapData);
    
    // Simpan di cache
    sourceMapCache[url] = consumer;
    
    return consumer;
  } catch (error) {
    console.error('Error fetching source map:', error);
    return null;
  }
}

/**
 * Mengupload source map ke server LogRaven
 */
export async function uploadSourceMap({
  dsn,
  release,
  sourceMap,
  sourceFile,
  minifiedFile
}: UploadSourceMapOptions): Promise<boolean> {
  try {
    // Parse sourceMap jika string
    const sourceMapData = typeof sourceMap === 'string' 
      ? JSON.parse(sourceMap) 
      : sourceMap;
    
    // Validasi source map
    if (!sourceMapData.version || !sourceMapData.sources || !sourceMapData.mappings) {
      throw new Error('Invalid source map format');
    }

    // Ekstrak API URL dari DSN
    const apiUrl = dsn.split('@')[1]?.split('/')[0] || 'localhost:3000';
    const protocol = apiUrl.includes('localhost') ? 'http://' : 'https://';
    
    // Kirim ke server
    const response = await fetch(`${protocol}${apiUrl}/api/sourcemaps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DSN': dsn
      },
      body: JSON.stringify({
        release,
        sourceMap: sourceMapData,
        sourceFile,
        minifiedFile: minifiedFile || sourceFile
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to upload source map: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error uploading source map:', error);
    return false;
  }
}

/**
 * Mencari URL source map dari baris terakhir file JavaScript
 */
export async function extractSourceMapUrl(fileUrl: string): Promise<string | null> {
  try {
    let jsContent: string;

    // Pendekatan berbeda untuk Node.js vs browser
    if (isNodeEnvironment && (fileUrl.startsWith('/') || fileUrl.startsWith('file:'))) {
      // Handle file path di Node.js
      let filePath = fileUrl;
      if (fileUrl.startsWith('file:')) {
        // Convert file:// URL to file path
        filePath = new URL(fileUrl).pathname;
      }
      
      if (!fs.existsSync(filePath)) {
        console.warn(`JavaScript file not found: ${filePath}`);
        return null;
      }
      
      // Baca file sebagai string
      jsContent = fs.readFileSync(filePath, 'utf8');
    } else {
      // Menggunakan fetch di browser atau untuk URL http/https di Node.js
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return null;
      }
      jsContent = await response.text();
    }
    
    // Regex untuk mencari source map URL
    const sourceMapComment = /\/\/# sourceMappingURL=(.+)$/m;
    const match = jsContent.match(sourceMapComment);
    
    if (match && match[1]) {
      // Jika relatif URL, konversi menjadi absolute
      const sourceMapUrl = match[1];
      if (sourceMapUrl.startsWith('http')) {
        return sourceMapUrl;
      } else if (isNodeEnvironment && (fileUrl.startsWith('/') || fileUrl.startsWith('file:'))) {
        // File path handling for Node.js
        let basePath = fileUrl;
        if (fileUrl.startsWith('file:')) {
          basePath = new URL(fileUrl).pathname;
        }
        return path.join(path.dirname(basePath), sourceMapUrl);
      } else {
        // URL handling for browser
        const baseUrl = fileUrl.substring(0, fileUrl.lastIndexOf('/') + 1);
        return `${baseUrl}${sourceMapUrl}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting source map URL:', error);
    return null;
  }
}

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
 * Transform stack trace menggunakan source map
 */
export async function transformStackTrace(stackTrace: string): Promise<string> {
  if (!stackTrace) return stackTrace;
  
  const lines = stackTrace.split('\n');
  const transformedLines: string[] = [];
  
  // Menyimpan source map untuk setiap file
  const sourceMapConsumers: Record<string, SourceMapConsumer | null> = {};
  
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
    
    // Coba dapatkan source map untuk file ini
    if (!sourceMapConsumers[file]) {
      const sourceMapUrl = await extractSourceMapUrl(file);
      sourceMapConsumers[file] = sourceMapUrl ? await fetchSourceMap(sourceMapUrl) : null;
    }
    
    const consumer = sourceMapConsumers[file];
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

// Membersihkan cache dan consumers ketika tidak diperlukan lagi
export function clearSourceMapCache(): void {
  Object.values(sourceMapCache).forEach(consumer => {
    consumer.destroy();
  });
  Object.keys(sourceMapCache).forEach(key => {
    delete sourceMapCache[key];
  });
  
  Object.values(sourceMapConsumers).forEach(consumer => {
    if (consumer) consumer.destroy();
  });
  Object.keys(sourceMapConsumers).forEach(key => {
    delete sourceMapConsumers[key];
  });
} 