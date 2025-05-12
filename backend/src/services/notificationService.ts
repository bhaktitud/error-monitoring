import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import axios from 'axios';

const prisma = new PrismaClient();

// Interface untuk konfigurasi notifikasi
interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel?: string;
    username?: string;
  };
  discord?: {
    enabled: boolean;
    webhookUrl: string;
    username?: string;
  };
  telegram?: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
}

// Interface untuk model Project dengan notificationSettings
interface ProjectWithSettings {
  id: string;
  name: string;
  ownerId: string;
  dsn: string;
  createdAt: Date;
  notificationSettings?: any;
}

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
      
      // Jika notifikasi tipe 'error', cek konfigurasi notifikasi eksternal
      if (data.type === 'error' && data.data?.projectId) {
        await this.sendExternalNotifications(data, data.data.projectId);
      }
      
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
  
  // Mengirim notifikasi ke platform eksternal (Slack, Discord, Telegram)
  private async sendExternalNotifications(
    notificationData: {
      title: string;
      message: string;
      type: string;
      data?: any;
    },
    projectId: string
  ) {
    try {
      // Ambil konfigurasi notifikasi project dari database
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          ownerId: true,
          dsn: true,
          createdAt: true,
        },
      }) as unknown as ProjectWithSettings;
      
      // Cek konfigurasi notifikasi di project (perlu query terpisah)
      const projectSettings = await prisma.$queryRaw`
        SELECT "notificationSettings" FROM "Project" WHERE id = ${projectId}
      `;
      
      const notificationSettings = projectSettings && Array.isArray(projectSettings) && projectSettings.length > 0 
        ? projectSettings[0]?.notificationSettings 
        : null;
      
      if (!project || !notificationSettings) {
        console.log('No notification settings found for project', projectId);
        return;
      }
      
      // Assign notification settings ke project
      project.notificationSettings = notificationSettings;
      const config = project.notificationSettings as unknown as NotificationConfig;
      
      // Format tanggal
      const timestamp = new Date().toISOString();
      const formattedDate = new Date().toLocaleString('id-ID');
      
      // Extract data dari notification
      const { title, message, data } = notificationData;
      
      // Format pesan yang lebih lengkap dengan data error
      const errorDetails = data?.error ? {
        errorType: data.error.errorType || 'Unknown Error',
        errorMessage: data.error.message || 'No message',
        environment: data.error.environment || 'unknown',
        browser: data.error.browser,
        os: data.error.os,
        url: data.error.url,
      } : {};
      
      // Kirim notifikasi ke Slack jika dikonfigurasi
      if (config.slack?.enabled && config.slack.webhookUrl) {
        await this.sendSlackNotification({
          webhookUrl: config.slack.webhookUrl,
          channel: config.slack.channel,
          username: config.slack.username || 'LogRaven Bot',
          projectName: project.name,
          title,
          message,
          timestamp,
          errorDetails,
        });
      }
      
      // Kirim notifikasi ke Discord jika dikonfigurasi
      if (config.discord?.enabled && config.discord.webhookUrl) {
        await this.sendDiscordNotification({
          webhookUrl: config.discord.webhookUrl,
          username: config.discord.username || 'LogRaven Bot',
          projectName: project.name,
          title,
          message,
          timestamp,
          errorDetails,
        });
      }
      
      // Kirim notifikasi ke Telegram jika dikonfigurasi
      if (config.telegram?.enabled && config.telegram.botToken && config.telegram.chatId) {
        await this.sendTelegramNotification({
          botToken: config.telegram.botToken,
          chatId: config.telegram.chatId,
          projectName: project.name,
          title,
          message,
          formattedDate,
          errorDetails,
        });
      }
    } catch (error) {
      console.error('Error sending external notifications:', error);
    }
  }
  
  // Mengirim notifikasi ke Slack
  private async sendSlackNotification({
    webhookUrl,
    channel,
    username,
    projectName,
    title,
    message,
    timestamp,
    errorDetails,
  }: {
    webhookUrl: string;
    channel?: string;
    username: string;
    projectName: string;
    title: string;
    message: string;
    timestamp: string;
    errorDetails: any;
  }) {
    try {
      // Buat payload Slack dengan format blocks
      const payload = {
        channel,
        username,
        icon_emoji: ':warning:',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🔴 Error di ${projectName}`,
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Error Type:*\n${errorDetails.errorType || title}`
              },
              {
                type: 'mrkdwn',
                text: `*Environment:*\n${errorDetails.environment || 'unknown'}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${errorDetails.errorMessage || message}`
            }
          }
        ]
      };
      
      // Tambahkan detail browser dan OS jika ada
      if (errorDetails.browser || errorDetails.os) {
        payload.blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Browser:*\n${errorDetails.browser || 'unknown'}`
            },
            {
              type: 'mrkdwn',
              text: `*OS:*\n${errorDetails.os || 'unknown'}`
            }
          ]
        });
      }
      
      // Tambahkan URL di mana error terjadi jika ada
      if (errorDetails.url) {
        payload.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*URL:*\n${errorDetails.url}`
          }
        });
      }
      
      // Tambahkan footer dengan timestamp
      payload.blocks.push({
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: `Reported at ${new Date(timestamp).toLocaleString()}`,
            emoji: true
          }
        ] as Array<{type: string, text: string, emoji?: boolean}>
      } as any);
      
      // Kirim notifikasi ke Slack
      await axios.post(webhookUrl, payload);
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Error sending Slack notification:', error);
    }
  }
  
  // Mengirim notifikasi ke Discord
  private async sendDiscordNotification({
    webhookUrl,
    username,
    projectName,
    title,
    message,
    timestamp,
    errorDetails,
  }: {
    webhookUrl: string;
    username: string;
    projectName: string;
    title: string;
    message: string;
    timestamp: string;
    errorDetails: any;
  }) {
    try {
      // Buat payload Discord dengan embeds
      const payload = {
        username,
        avatar_url: 'https://i.imgur.com/oBPXx0D.png', // LogRaven logo URL (placeholder)
        content: `**🔴 New Error Alert in ${projectName}**`,
        embeds: [
          {
            title: errorDetails.errorType || title,
            description: errorDetails.errorMessage || message,
            color: 14423100, // Red color
            fields: [
              {
                name: 'Environment',
                value: errorDetails.environment || 'unknown',
                inline: true
              }
            ],
            footer: {
              text: `LogRaven • ${new Date(timestamp).toLocaleString()}`
            }
          }
        ]
      };
      
      // Tambahkan detail browser dan OS jika ada
      if (errorDetails.browser) {
        payload.embeds[0].fields.push({
          name: 'Browser',
          value: errorDetails.browser,
          inline: true
        });
      }
      
      if (errorDetails.os) {
        payload.embeds[0].fields.push({
          name: 'OS',
          value: errorDetails.os,
          inline: true
        });
      }
      
      // Tambahkan URL jika ada
      if (errorDetails.url) {
        payload.embeds[0].fields.push({
          name: 'URL',
          value: errorDetails.url,
          inline: false
        });
      }
      
      // Kirim notifikasi ke Discord
      await axios.post(webhookUrl, payload);
      console.log('Discord notification sent successfully');
    } catch (error) {
      console.error('Error sending Discord notification:', error);
    }
  }
  
  // Mengirim notifikasi ke Telegram
  private async sendTelegramNotification({
    botToken,
    chatId,
    projectName,
    title,
    message,
    formattedDate,
    errorDetails,
  }: {
    botToken: string;
    chatId: string;
    projectName: string;
    title: string;
    message: string;
    formattedDate: string;
    errorDetails: any;
  }) {
    try {
      // Format pesan Telegram dengan Markdown
      let telegramMessage = `🔴 *Error di ${projectName}*\n\n`;
      telegramMessage += `*Type:* ${errorDetails.errorType || title}\n`;
      telegramMessage += `*Message:* ${errorDetails.errorMessage || message}\n\n`;
      
      // Tambahkan detail environment, browser, dan OS jika ada
      if (errorDetails.environment) {
        telegramMessage += `*Environment:* ${errorDetails.environment}\n`;
      }
      
      if (errorDetails.browser) {
        telegramMessage += `*Browser:* ${errorDetails.browser}\n`;
      }
      
      if (errorDetails.os) {
        telegramMessage += `*OS:* ${errorDetails.os}\n`;
      }
      
      // Tambahkan URL jika ada
      if (errorDetails.url) {
        telegramMessage += `\n*URL:* ${errorDetails.url}\n`;
      }
      
      // Tambahkan timestamp
      telegramMessage += `\n📅 ${formattedDate}`;
      
      // Encode URI component untuk karakter khusus
      telegramMessage = encodeURIComponent(telegramMessage);
      
      // Kirim notifikasi ke Telegram
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&parse_mode=Markdown&text=${telegramMessage}`;
      await axios.get(telegramUrl);
      console.log('Telegram notification sent successfully');
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
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