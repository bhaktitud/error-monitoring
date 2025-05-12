import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  // Mendapatkan semua notifikasi user
  getNotifications = (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      this.notificationService.getUserNotifications(userId, page, limit)
        .then(result => res.json(result))
        .catch(error => {
          console.error('Error getting notifications:', error);
          res.status(500).json({ error: 'Internal server error' });
        });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Menandai notifikasi sebagai telah dibaca
  markAsRead = (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { notificationId } = req.params;

      this.notificationService.markAsRead(notificationId, userId)
        .then(notification => res.json(notification))
        .catch(error => {
          console.error('Error marking notification as read:', error);
          res.status(500).json({ error: 'Internal server error' });
        });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Menandai semua notifikasi sebagai telah dibaca
  markAllAsRead = (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      this.notificationService.markAllAsRead(userId)
        .then(() => res.json({ message: 'All notifications marked as read' }))
        .catch(error => {
          console.error('Error marking all notifications as read:', error);
          res.status(500).json({ error: 'Internal server error' });
        });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Menghapus notifikasi
  deleteNotification = (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { notificationId } = req.params;

      this.notificationService.deleteNotification(notificationId, userId)
        .then(() => res.json({ message: 'Notification deleted successfully' }))
        .catch(error => {
          console.error('Error deleting notification:', error);
          res.status(500).json({ error: 'Internal server error' });
        });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Mendapatkan jumlah notifikasi yang belum dibaca
  getUnreadCount = (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      this.notificationService.getUnreadCount(userId)
        .then(count => res.json({ count }))
        .catch(error => {
          console.error('Error getting unread count:', error);
          res.status(500).json({ error: 'Internal server error' });
        });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
} 