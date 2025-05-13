import { Application } from 'express';
import { Server } from 'socket.io';
import authRoutes from '../routes/auth';
import projectRoutes from '../routes/project';
import eventRoutes from '../routes/event';
import groupRoutes from '../routes/group';
import webhookRoutes from '../routes/webhook';
import statsRoutes from '../routes/stats';
import notificationRoutes from '../routes/notification';
import planRoutes from '../routes/plan';
import mediaRoutes from '../routes/media';
import sourceMapRoutes from '../routes/sourceMap';
import { createNotificationRoutes } from '../routes/notificationRoutes';
import { getUserConnectionsStats } from '../services/socketService';
import { getIpConnectionsStats } from '../middleware/socketRateLimit';

/**
 * Mengatur semua routes pada aplikasi Express
 * @param app Aplikasi Express
 * @param io Server Socket.IO
 */
export function setupRoutes(app: Application, io: Server): void {
  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api', webhookRoutes);
  app.use('/api', statsRoutes);
  
  // Notifikasi routes - ada 2 implementasi berbeda
  app.use('/api/notifications', createNotificationRoutes(io)); // Untuk in-app notifications
  app.use('/api', notificationRoutes); // Untuk settings notifikasi
  
  app.use('/api/plans', planRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/', sourceMapRoutes);

  // Endpoint untuk memantau koneksi aktif - hanya untuk debugging
  app.get('/api/debug/socket-connections', (req, res) => {
    // Dapatkan statistik koneksi pengguna
    const userStats = getUserConnectionsStats();
    
    // Tambahkan informasi IP
    const ipStats = getIpConnectionsStats();
    
    res.json({
      ...userStats,
      ipConnections: ipStats
    });
  });
} 