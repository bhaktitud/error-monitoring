import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { NotificationService } from '../services/notificationService';
import { Server } from 'socket.io';
import { authenticateToken } from '../middleware/auth';

export const createNotificationRoutes = (io: Server) => {
  const router = Router();
  const notificationService = new NotificationService(io);
  const notificationController = new NotificationController(notificationService);

  // Semua route memerlukan autentikasi
  router.use(authenticateToken);

  // Mendapatkan semua notifikasi user
  router.get('/', notificationController.getNotifications);

  // Mendapatkan jumlah notifikasi yang belum dibaca
  router.get('/unread/count', notificationController.getUnreadCount);

  // Menandai notifikasi sebagai telah dibaca
  router.put('/:notificationId/read', notificationController.markAsRead);

  // Menandai semua notifikasi sebagai telah dibaca
  router.put('/read/all', notificationController.markAllAsRead);

  // Menghapus notifikasi
  router.delete('/:notificationId', notificationController.deleteNotification);
  
  // Endpoint untuk mengirim test notification
  router.post('/test', async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID tidak ditemukan' });
      }
      
      // Buat test notification
      const testNotification = await notificationService.createNotification({
        userId,
        type: 'MANUAL_TEST',
        title: 'Test Notification',
        message: 'Ini adalah test notification yang dikirim secara manual',
        data: { source: 'manual', timestamp: Date.now() }
      });
      
      res.json({ 
        success: true, 
        message: 'Test notification berhasil dikirim',
        notification: testNotification
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ error: 'Gagal mengirim test notification' });
    }
  });

  return router;
}; 