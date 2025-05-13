const express = require('express');
const dotenv = require('dotenv');
const { init, captureException, setTags, setUser, addBreadcrumb, uploadSourceMap } = require('@lograven/sdk');
const { generateTestError } = require('./errorGenerator');
const os = require('os');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Informasi aplikasi yang konsisten
const APP_VERSION = '1.0.0';
const APP_NAME = 'example-express-server';
const SERVER_ID = os.hostname();

// Inisialisasi SDK dengan informasi aplikasi yang lebih terstruktur
init({
  dsn: process.env.ERROR_MONITOR_DSN || 'ee00ecb4-c3af-4fc0-93fa-01629b559694',
  apiUrl: process.env.ERROR_MONITOR_API_URL || 'http://localhost:3000',
  environment: process.env.NODE_ENV || 'production',
  release: APP_VERSION,
  sdk: {
    useSourceMaps: true,
    captureUnhandledRejections: true,
    captureUncaughtExceptions: true,
    breadcrumbs: true,
    maxBreadcrumbs: 30,
    sourceMapUploadEndpoint: process.env.ERROR_MONITOR_API_URL ? `${process.env.ERROR_MONITOR_API_URL}/api/sourcemaps` : 'http://localhost:3000/api/sourcemaps'
  }
});

// Set tags global yang akan disertakan di semua error report
setTags({
  server: SERVER_ID,
  application: APP_NAME,
  nodejs_version: process.version,
  platform: process.platform,
  arch: process.arch
});

// Membuat logger kustom untuk membantu debug
const logger = {
  info: (message) => console.log(`\x1b[34m[INFO]\x1b[0m ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`),
  error: (message) => console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`),
  warn: (message) => console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`)
};

// Fungsi pembungkus untuk route handler async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    // Tambahkan informasi kontekstual ke error
    if (err) {
      err.route = req.path;
      err.extraData = {
        method: req.method,
        path: req.path,
        query: req.query,
        params: req.params,
        routeName: req.route ? req.route.path : 'unknown',
        requestTime: new Date().toISOString()
      };
    }
    next(err);
  });
};

// Fungsi untuk memfilter data sensitif
function filterSensitiveData(data) {
  if (!data) return {};
  
  const sensitiveKeys = ['password', 'token', 'authorization', 'cookie', 'secret', 'api_key', 'apikey'];
  const filtered = JSON.parse(JSON.stringify(data));
  
  const maskSensitiveData = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        maskSensitiveData(obj[key]);
      }
    });
  };
  
  maskSensitiveData(filtered);
  return filtered;
}

// Fungsi untuk menghasilkan ID unik untuk error
function generateErrorId() {
  return `err-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

// Tipe error yang didukung
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  SYSTEM: 'SYSTEM_ERROR',
  API: 'API_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Fungsi untuk mencatat informasi sistem saat terjadi error
function captureSystemInfo() {
  return {
    memory: {
      free: os.freemem(),
      total: os.totalmem(),
      usage: process.memoryUsage()
    },
    cpu: {
      load: os.loadavg(),
      cores: os.cpus().length
    },
    uptime: {
      system: os.uptime(),
      process: process.uptime()
    },
    platform: process.platform,
    arch: process.arch,
    node: process.version
  };
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware untuk parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fungsi untuk upload source maps
async function uploadAllSourceMaps() {
  try {
    // Direktori tempat source maps berada
    const sourceMapDir = path.join(__dirname);
    
    logger.info(`Mencari source maps di: ${sourceMapDir}`);
    
    // Cari semua file .map
    const files = fs.readdirSync(sourceMapDir);
    const sourceMapFiles = files.filter(file => file.endsWith('.map'));
    
    if (sourceMapFiles.length === 0) {
      logger.warn('Tidak ditemukan file source map');
      return;
    }
    
    logger.info(`Ditemukan ${sourceMapFiles.length} file source map, mencoba upload...`);
    
    // Upload setiap source map
    for (const mapFile of sourceMapFiles) {
      const minifiedFile = mapFile.replace('.map', '');
      const mapFilePath = path.join(sourceMapDir, mapFile);
      
      logger.info(`Mengupload source map: ${mapFile}...`);
      
      try {
        await uploadSourceMap({
          sourceMapsFile: mapFilePath,
          minifiedFile: minifiedFile,
          version: APP_VERSION,
          applicationName: APP_NAME
        });
        logger.success(`Source map ${mapFile} berhasil diupload!`);
      } catch (error) {
        logger.error(`Gagal mengupload source map ${mapFile}: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`Error saat mengunggah source maps: ${error.message}`);
  }
}

// Fungsi untuk mengelola breadcrumbs dengan lebih konsisten
function addAppBreadcrumb(category, message, data = {}, level = 'info') {
  // Pastikan setiap breadcrumb memiliki timestamp dan ID jika tersedia
  const enrichedData = {
    ...data,
    timestamp: new Date().toISOString(),
    // Tambahkan requestId jika ada dalam konteks request
    ...(global.currentRequestId ? { requestId: global.currentRequestId } : {})
  };
  
  // Buat objek breadcrumb
  const breadcrumb = {
    category, 
    message,
    data: enrichedData,
    level,
    timestamp: new Date().toISOString()
  };
  
  // Simpan di koleksi global untuk referensi
  if (!global.breadcrumbs) {
    global.breadcrumbs = [];
  }
  
  // Batasi jumlah breadcrumb yang disimpan
  if (global.breadcrumbs.length >= 30) {
    global.breadcrumbs.shift(); // Hapus yang paling lama
  }
  
  global.breadcrumbs.push(breadcrumb);
  
  // Tambahkan breadcrumb ke SDK
  addBreadcrumb({
    category, 
    message,
    data: enrichedData,
    level
  });
  
  // Log breadcrumb ke konsol juga untuk debugging
  const logMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info';
  logger[logMethod](`[Breadcrumb] [${category}] ${message}`);
  
  return enrichedData; // Return data untuk keperluan chaining
}

// Middleware untuk menyimpan requestId secara global dan memulai tracking breadcrumbs
app.use((req, res, next) => {
  // Set request ID untuk tracking
  req.requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Simpan di global scope untuk breadcrumbs yang dibuat di luar konteks request
  global.currentRequestId = req.requestId;
  
  // Set waktu mulai untuk mengukur durasi request
  req.startTime = Date.now();
  
  // Log request
  logger.info(`[${req.requestId}] ${req.method} ${req.url}`);
  
  // Tambahkan breadcrumb untuk setiap request
  addAppBreadcrumb('http', `Request: ${req.method} ${req.url}`, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    timestamp: new Date().toISOString()
  });
  
  // Tambahkan listener untuk menangkap response selesai
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.info(`[${req.requestId}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    
    // Tambahkan breadcrumb untuk response
    addAppBreadcrumb('http', `Response: ${res.statusCode}`, {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    }, res.statusCode >= 400 ? 'error' : 'info');
    
    // Bersihkan global requestId
    global.currentRequestId = null;
  });
  
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Example Express backend running!');
});

// Contoh route yang menghasilkan error
app.get('/error', (req, res, next) => {
  const error = new Error('Contoh error dari /error');
  error.code = ERROR_TYPES.SYSTEM;
  error.statusCode = 500;
  error.context = {
    source: 'express-route',
    path: '/error',
    endpoint: 'GET /error'
  };
  next(error);
});

// Route dengan error async
app.get('/async-error', asyncHandler(async (req, res) => {
  const error = new Error('Error dari route async');
  error.code = ERROR_TYPES.API;
  error.statusCode = 500;
  error.requestId = req.requestId;
  error.context = {
    source: 'async-handler',
    endpoint: 'GET /async-error',
    timestamp: new Date().toISOString()
  };
  throw error;
}));

// Route test dengan konteks error yang lebih detail
app.post('/test-detailed-error', asyncHandler(async (req, res) => {
  const { scenarioType, userId, action } = req.body;
  
  // Set user context untuk error reporting
  if (userId) {
    setUser({
      id: userId,
      username: userId,
      role: req.body.role || 'user',
      requestId: req.requestId
    });
  }
  
  // Tambahkan breadcrumb untuk aktivitas user
  addAppBreadcrumb('user', `User action: ${action || 'unknown'}`, {
    requestId: req.requestId,
    userId: userId || 'anonymous',
    actionType: action,
    timestamp: new Date().toISOString()
  }, 'info');
  
  // Simulasi proses yang berjalan sebelum error
  addAppBreadcrumb('process', 'Starting database operation', {
    requestId: req.requestId,
    operation: 'db.connect',
    scenario: scenarioType,
    timestamp: new Date().toISOString()
  }, 'info');

  // Tunggu sedikit untuk simulasi proses
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Tambahkan breadcrumb sebelum error terjadi
  addAppBreadcrumb('database', 'Database operation failed', {
    requestId: req.requestId,
    operation: 'db.query',
    scenario: scenarioType,
    error: true,
    timestamp: new Date().toISOString()
  }, 'error');

  // Buat error yang kaya informasi
  const error = new Error(`Error terperinci dari skenario: ${scenarioType || 'default'}`);
  
  // Tambahkan metadata terstruktur
  error.code = ERROR_TYPES.DATABASE;
  error.statusCode = 500;
  error.requestId = req.requestId;
  error.component = 'DatabaseService';
  error.operation = 'executeQuery';
  error.query = 'SELECT * FROM users WHERE scenario = ?';
  error.params = [scenarioType];
  
  // Tambahkan data kontekstual yang lebih kaya dan terstruktur
  error.context = {
    user: {
      id: userId || 'anonymous',
      action,
      role: req.body.role || 'user'
    },
    request: {
      id: req.requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      body: filterSensitiveData(req.body),
      headers: filterSensitiveData({
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type'],
        accept: req.headers.accept
      })
    },
    database: {
      type: 'PostgreSQL',
      operation: 'SELECT',
      table: 'users',
      scenario: scenarioType
    },
    timing: {
      requestStarted: req.startTime,
      errorOccurred: Date.now(),
      elapsed: Date.now() - req.startTime
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'production',
      serverName: SERVER_ID,
      system: captureSystemInfo()
    }
  };
  
  throw error;
}));

// Middleware untuk menangani error - HARUS berada di bawah semua routes
app.use((err, req, res, next) => {
  // Generate error ID untuk referensi
  const errorId = generateErrorId();
  
  // Log error dengan detail ke konsol
  logger.error(`[${req.requestId || 'unknown'}] Error: ${err.message}`);
  if (err.stack) {
    logger.error(`Stack trace: ${err.stack}`);
  }
  
  // Tambahkan breadcrumb untuk error
  addAppBreadcrumb('error', `Error caught: ${err.message}`, {
    errorId,
    requestId: req.requestId,
    code: err.code,
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString()
  }, 'error');

  // Set tags khusus untuk error ini
  setTags({
    errorId,
    errorType: err.code || ERROR_TYPES.UNKNOWN,
    statusCode: err.statusCode || 500,
    requestId: req.requestId,
    endpoint: `${req.method} ${req.path}`
  });
  
  // Dapatkan breadcrumbs untuk request ini
  const appBreadcrumbs = global.breadcrumbs ? global.breadcrumbs.filter(bc => 
    bc.data && bc.data.requestId === req.requestId
  ) : [];
  
  // Kumpulkan semua informasi yang relevan untuk error
  const errorInfo = {
    // Metadata dasar
    errorId,
    type: err.constructor.name,
    name: err.name,
    message: err.message,
    code: err.code || ERROR_TYPES.UNKNOWN,
    statusCode: err.statusCode || 500,
    component: err.component || 'Unknown',
    operation: err.operation || 'Unknown',
    
    // Informasi request
    request: {
      id: req.requestId,
      url: req.originalUrl,
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      body: filterSensitiveData(req.body),
      headers: filterSensitiveData({
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type'],
        accept: req.headers.accept,
        referer: req.headers.referer
      }),
      ip: req.ip || req.connection.remoteAddress
    },
    
    // Informasi pengguna (jika ada)
    user: req.user || null,
    
    // Informasi waktu
    timestamp: new Date().toISOString(),
    duration: req.startTime ? (Date.now() - req.startTime) : null,
    
    // Data sistem
    system: captureSystemInfo(),
    
    // Data tambahan dari error
    context: err.context || {},
    
    // Jejak aktivitas pengguna (breadcrumbs)
    breadcrumbs: appBreadcrumbs,
    
    // Stack trace jika dalam mode development
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  };
  
  // Tangkap error menggunakan SDK dengan informasi detail
  captureException(err, {
    tags: {
      errorId,
      errorType: err.code || ERROR_TYPES.UNKNOWN,
      statusCode: err.statusCode || 500,
      requestId: req.requestId,
      endpoint: `${req.method} ${req.path}`
    },
    extraContext: errorInfo,
    user: errorInfo.user,
    
    // Tambahkan semua informasi kontekstual
    ...errorInfo.context,
    
    // Eksplisit tambahkan breadcrumbs ke payload
    breadcrumbs: appBreadcrumbs,
    
    // Tambahkan data khusus lainnya
    errorDetails: {
      component: err.component,
      operation: err.operation,
      query: err.query,
      params: err.params
    }
  });
  
  // Berikan respons sesuai dengan jenis error
  const statusCode = err.statusCode || 500;
  let errorResponse;
  
  if (process.env.NODE_ENV === 'production') {
    // Respons produksi, minimal informasi untuk keamanan
    errorResponse = {
      status: 'error',
      message: 'Terjadi kesalahan pada server',
      errorId: errorId,
      code: err.code
    };
  } else {
    // Respons development, lengkap dengan detail
    errorResponse = {
      status: 'error',
      message: err.message || 'Terjadi kesalahan pada server',
      errorId: errorId,
      code: err.code,
      type: err.constructor.name,
      statusCode,
      
      // Tambahkan data yang berguna untuk debug
      request: {
        id: req.requestId,
        method: req.method,
        path: req.path
      },
      
      // Data stack dan konteks hanya untuk development
      stack: err.stack,
      context: err.context,
      timing: {
        requestStarted: req.startTime,
        errorOccurred: Date.now(),
        elapsed: req.startTime ? (Date.now() - req.startTime) : null
      },
      
      // Tambahkan breadcrumbs untuk debugging
      breadcrumbs: appBreadcrumbs.map(b => ({
        category: b.category,
        message: b.message, 
        level: b.level,
        timestamp: b.timestamp || b.data?.timestamp
      }))
    };
  }
  
  // Pastikan header Content-Type sudah diatur
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json(errorResponse);
});

// Buat server berjalan
const server = app.listen(PORT, async () => {
  logger.success(`Server berjalan di http://localhost:${PORT}`);
  logger.info(`Coba akses: http://localhost:${PORT}/error untuk error biasa`);
  logger.info(`Coba akses: http://localhost:${PORT}/async-error untuk error async`);
  logger.info(`Untuk mencoba error dengan detail lengkap: curl -X POST http://localhost:${PORT}/test-detailed-error -H "Content-Type: application/json" -d '{"scenarioType":"database-error","userId":"test-user","action":"test-action"}'`);
  
  // Upload source maps setelah server berjalan
  await uploadAllSourceMaps();
}); 