import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Fungsi untuk mengambil semua file TypeScript dan TSX di dalam proyek
function getAllTSFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
      getAllTSFiles(filePath, fileList);
    } else if (
      stat.isFile() && 
      (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) &&
      !filePath.endsWith('.d.ts')
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fungsi untuk mengekstrak import yang tidak digunakan dari file
function extractUnusedImports(filePath) {
  try {
    // Baca konten file
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Pattern untuk mendeteksi import statement
    const importRegex = /^import\s+{([^}]+)}\s+from\s+['"].+['"];?\s*$/;
    const namedImportRegex = /\s*([^,\s]+)\s*,?/g;
    
    const unusedImports = [];
    
    // Analisis setiap baris
    lines.forEach((line, lineIndex) => {
      const importMatch = line.match(importRegex);
      if (!importMatch) return;
      
      const importNames = importMatch[1];
      let match;
      const namedImports = [];
      
      namedImportRegex.lastIndex = 0;
      while ((match = namedImportRegex.exec(importNames)) !== null) {
        const importName = match[1].trim();
        if (importName) {
          namedImports.push(importName);
          
          // Cek apakah import digunakan di file (pencarian sederhana)
          const importUsageRegex = new RegExp(`\\b${importName}\\b`, 'g');
          let isUsed = false;
          
          for (let i = lineIndex + 1; i < lines.length; i++) {
            if (importUsageRegex.test(lines[i])) {
              isUsed = true;
              break;
            }
          }
          
          if (!isUsed) {
            unusedImports.push({ 
              line: lineIndex + 1, 
              name: importName, 
              fullLine: line.trim() 
            });
          }
        }
      }
    });
    
    return unusedImports.length > 0 ? { file: filePath, unusedImports } : null;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

// Main function
function findUnusedImports() {
  const allFiles = getAllTSFiles('./src');
  console.log(`Scanning ${allFiles.length} files for unused imports...`);
  
  const results = [];
  
  allFiles.forEach(file => {
    const unusedImportsData = extractUnusedImports(file);
    if (unusedImportsData) {
      results.push(unusedImportsData);
    }
  });
  
  // Print results
  if (results.length === 0) {
    console.log('No unused imports found!');
  } else {
    console.log(`Found unused imports in ${results.length} files:`);
    
    results.forEach(({ file, unusedImports }) => {
      console.log(`\n${file}:`);
      unusedImports.forEach(({ line, name, fullLine }) => {
        console.log(`  Line ${line}: unused import '${name}' in '${fullLine}'`);
      });
    });
  }
}

findUnusedImports(); 