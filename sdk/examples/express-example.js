const express = require('express');
const ErrorReporting = require('../index');

// Inisialisasi SDK
ErrorReporting.init({
  dsn: 'your-project-dsn',
  apiUrl: 'http://localhost:3000',
  environment: 'development',
  release: '1.0.0',
  sdk: {
    captureUnhandledRejections: true,
    captureUncaughtExceptions: true,
    // Hook sebelum mengirim error ke server
    beforeSend: (event, error) => {
      // Contoh custom logic:
      // Tidak mengirim error 404 ke server
      if (event.statusCode === 404) {
        return null; // Jangan kirim ke server
      }
      return event;
    }
  }
});

// Siapkan informasi user dan tags global
ErrorReporting.setUser({
  id: 'user-123',
  email: 'user@example.com',
  role: 'admin'
});

ErrorReporting.setTags({
  app: 'express-example',
  server: 'api-1'
});

const app = express();
app.use(express.json());

// Gunakan middleware SDK di awal untuk melacak semua request
app.use(ErrorReporting.expressMiddleware());

// Route contoh yang berhasil
app.get('/', (req, res) => {
  // Tambahkan breadcrumb untuk debugging yang lebih baik
  ErrorReporting.addBreadcrumb({
    category: 'route',
    message: 'Home page accessed',
    data: { ip: req.ip }
  });
  
  res.send('Hello, world!');
});

// Route yang melempar error langsung
app.get('/error', (req, res) => {
  throw new Error('Ini adalah error yang sengaja dilemparkan');
});

// Route dengan async error
app.get('/async-error', async (req, res, next) => {
  try {
    // Simulasi operasi async yang gagal
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Async operation failed')), 100);
    });
  } catch (error) {
    // Tangkap dan kirim dengan konteks tambahan 
    ErrorReporting.captureException(error, {
      extraContext: {
        operation: 'fetchData',
        customerId: req.query.id
      }
    });
    
    next(error); // Teruskan ke error handler Express
  }
});

// Route untuk mencatat pesan log
app.get('/log-message', (req, res) => {
  // Catat pesan sebagai info
  ErrorReporting.captureMessage('User mengakses halaman log', 'info', {
    extraContext: { source: 'log-route' }
  });
  
  res.send('Pesan berhasil dicatat');
});

// Route dengan kode bisnis yang melanggar aturan
app.post('/users', (req, res) => {
  // Contoh validasi
  if (!req.body.email) {
    const error = new Error('Email wajib diisi');
    error.statusCode = 400;
    error.name = 'ValidationError';
    
    throw error;
  }
  
  // Normal response
  res.status(201).json({ success: true });
});

// Gunakan error handler middleware di akhir (sebelum error handler built-in Express)
app.use(ErrorReporting.expressErrorHandler());

// Error handler express standar
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred'
        : err.message
    }
  });
});

// Mulai server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 