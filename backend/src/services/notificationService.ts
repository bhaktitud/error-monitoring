import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

export class NotificationService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // Membuat notifikasi baru
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    console.log('Creating notification for user:', data.userId, 'with type:', data.type);
    console.log('Notification content:', {
      title: data.title,
      message: data.message,
      data: data.data
    });
    
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
        },
      });

      console.log('Notification created in database, ID:', notification.id);
      
      // Coba emit notifikasi (dengan broadcast jika gagal)
      this.emitNotification(data.userId, notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Method khusus untuk emitting notification dengan error handling
  private emitNotification(userId: string, notification: any) {
    try {
      // Log semua room yang tersedia
      console.log('Current rooms on server:', this.io.sockets.adapter.rooms);
      
      const roomName = `user:${userId}`;
      console.log('Emitting to room:', roomName);
      
      // Cek apakah room ada
      const room = this.io.sockets.adapter.rooms.get(roomName);
      if (!room || room.size === 0) {
        console.log(`Room ${roomName} doesn't exist or is empty, broadcasting to all authenticated sockets`);
        
        // Alternatif: broadcast ke semua socket yang terautentikasi dengan userId yang sama
        this.broadcastToUser(userId, notification);
        return;
      }
      
      // Kirim notifikasi real-time ke user
      this.io.to(roomName).emit('notification', notification);
      console.log('Notification emitted to room:', roomName);
    } catch (error) {
      console.error('Error emitting notification:', error);
      // Mencoba broadcast sebagai fallback
      this.broadcastToUser(userId, notification);
    }
  }
  
  // Broadcast ke semua socket yang terautentikasi dengan userId tertentu
  private broadcastToUser(userId: string, notification: any) {
    try {
      console.log('Broadcasting notification to all sockets of user:', userId);
      
      // Iterasi semua socket yang terhubung
      this.io.sockets.sockets.forEach((socket) => {
        if (socket.data.userId === userId) {
          console.log(`Broadcasting to socket ${socket.id} for user ${userId}`);
          socket.emit('notification', notification);
        }
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  }

  // Mendapatkan semua notifikasi user
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Menandai notifikasi sebagai telah dibaca
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Memastikan notifikasi milik user yang bersangkutan
      },
      data: { read: true },
    });
  }

  // Menandai semua notifikasi user sebagai telah dibaca
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  // Menghapus notifikasi
  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.delete({
      where: {
        id: notificationId,
        userId, // Memastikan notifikasi milik user yang bersangkutan
      },
    });
  }

  // Mendapatkan jumlah notifikasi yang belum dibaca
  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }
} 