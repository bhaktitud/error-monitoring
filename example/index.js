import express from 'express';
import dotenv from 'dotenv';
import { init, withErrorMonitoring } from '@bhaktixdev/error-monitor-sdk';

dotenv.config();

// Inisialisasi SDK
init({
  dsn: process.env.ERROR_MONITOR_DSN,
  apiUrl: process.env.ERROR_MONITOR_API_URL,
  environment: process.env.NODE_ENV || 'development',
  release: '1.0.0',
});

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware untuk menangani error
const errorHandler = withErrorMonitoring((err, req, res, next) => {
  console.error('Error caught by middleware:', err);
  res.status(err.status || 500).send('Terjadi kesalahan pada server');
});

// Middleware untuk logging request
const requestLogger = withErrorMonitoring((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Terapkan middleware
app.use(requestLogger);

// Routes
app.get('/', (req, res) => {
  res.send('Example Express backend running!');
});

app.get('/test', (req, res) => {
  res.send('Example Express backend running!');
});

// Contoh route yang menghasilkan error
app.get('/error', (req, res, next) => {
  next(new Error('Contoh error dari /error'));
});

app.get('/not-found', withErrorMonitoring(async (req, res) => {
  throw new Error('Contoh error dari endpoint /not-found');
}));

// Terapkan error handler di akhir
app.use(errorHandler);

// Middleware error bawaan Express (opsional, untuk response ke client)
app.use((err, req, res, next) => {
  res.status(500).send('Terjadi error!');
});

app.listen(PORT, () => {
  console.log(`Example backend running on port ${PORT}`);
}); 