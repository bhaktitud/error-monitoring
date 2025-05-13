import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

/**
 * Konfigurasi dan setup aplikasi Express
 * @returns Aplikasi Express yang sudah dikonfigurasi
 */
export function setupExpress(): Application {
  const app = express();
  
  // Middleware dasar
  app.use(cors({
    origin: '*', // Izinkan semua origin untuk debugging
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.send('Sentry Clone API running!');
  });
  
  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
} 