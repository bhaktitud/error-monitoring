import express from 'express';
import prisma from '../models/prisma';
import { authMiddleware } from '../utils/auth';
import { Resend } from 'resend';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

// Inisialisasi Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Tipe data untuk log request
interface RequestLogEntry {
  method: string;
  path: string;
  body: any;
  timestamp: string;
}

// Simpan log request dalam in-memory untuk debugging
let requestLog: RequestLogEntry[] = [];

// Logging middleware untuk mencatat request
router.use((req, res, next) => {
  console.log(`Notification Route Request: ${req.method} ${req.originalUrl}`);
  requestLog.push({
    method: req.method,
    path: req.originalUrl,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  // Jika log terlalu panjang, potong
  if (requestLog.length > 20) {
    requestLog = requestLog.slice(-20);
  }
  
  next();
});

// Middleware untuk memverifikasi akses admin/owner
async function verifyAdminOrOwnerAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    // Periksa apakah user ada
    if (!req.user) {
      return res.status(401).json({ error: 'Akses ditolak. Autentikasi diperlukan.' });
    }
    
    const userId = req.user.id;
    
    // Cari project
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Periksa apakah pengguna adalah pemilik
    if (project.ownerId === userId) {
      return next();
    }
    
    // Periksa apakah pengguna adalah admin
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: userId,
        role: 'admin'
      }
    });
    
    if (!membership) {
      return res.status(403).json({ 
        error: 'Akses ditolak', 
        message: 'Hanya admin atau pemilik proyek yang dapat mengelola pengaturan notifikasi' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error verifying access:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memverifikasi akses' });
  }
}

/**
 * Get notification settings
 * GET /api/notifications/projects/:id/settings
 */
router.get('/notifications/projects/:id/settings', authMiddleware, verifyAdminOrOwnerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifikasi project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Ambil settings dari database
    let settings = await prisma.projectNotificationSettings.findUnique({
      where: { projectId: id }
    });
    
    // Jika settings belum ada, buat default settings
    if (!settings) {
      settings = await prisma.projectNotificationSettings.create({
        data: {
          projectId: id,
          emailEnabled: false,
          slackEnabled: false,
          discordEnabled: false,
          telegramEnabled: false,
          notifyOnNewError: true,
          notifyOnResolvedError: false,
          minimumErrorLevel: 'error'
        }
      });
    }
    
    // Format data untuk respons API yang kompatibel dengan kode frontend yang sudah ada
    const formattedSettings = {
      email: settings.emailEnabled,
      slack: settings.slackEnabled,
      slackWebhookUrl: settings.slackWebhookUrl || '',
      discord: settings.discordEnabled,
      discordWebhookUrl: settings.discordWebhookUrl || '',
      telegram: settings.telegramEnabled,
      telegramBotToken: settings.telegramBotToken || '',
      telegramChatId: settings.telegramChatId || '',
      notifyOnNewError: settings.notifyOnNewError,
      notifyOnResolvedError: settings.notifyOnResolvedError,
      minimumErrorLevel: settings.minimumErrorLevel
    };
    
    res.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaturan notifikasi' });
  }
});

// Endpoint alternatif dengan path yang berbeda untuk berjaga-jaga
router.get('/projects/:id/notifications/settings', authMiddleware, verifyAdminOrOwnerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifikasi project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Ambil settings dari database
    let settings = await prisma.projectNotificationSettings.findUnique({
      where: { projectId: id }
    });
    
    // Jika settings belum ada, buat default settings
    if (!settings) {
      settings = await prisma.projectNotificationSettings.create({
        data: {
          projectId: id,
          emailEnabled: false,
          slackEnabled: false,
          discordEnabled: false,
          telegramEnabled: false,
          notifyOnNewError: true,
          notifyOnResolvedError: false,
          minimumErrorLevel: 'error'
        }
      });
    }
    
    // Format data untuk respons API yang kompatibel dengan kode frontend yang sudah ada
    const formattedSettings = {
      email: settings.emailEnabled,
      slack: settings.slackEnabled,
      slackWebhookUrl: settings.slackWebhookUrl || '',
      discord: settings.discordEnabled,
      discordWebhookUrl: settings.discordWebhookUrl || '',
      telegram: settings.telegramEnabled,
      telegramBotToken: settings.telegramBotToken || '',
      telegramChatId: settings.telegramChatId || '',
      notifyOnNewError: settings.notifyOnNewError,
      notifyOnResolvedError: settings.notifyOnResolvedError,
      minimumErrorLevel: settings.minimumErrorLevel
    };
    
    res.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaturan notifikasi' });
  }
});

/**
 * Update notification settings
 * PATCH /api/notifications/projects/:id/settings
 */
router.patch('/notifications/projects/:id/settings', authMiddleware, verifyAdminOrOwnerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Verifikasi project
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Periksa apakah settings sudah ada
    let settings = await prisma.projectNotificationSettings.findUnique({
      where: { projectId: id }
    });
    
    // Transform updates dari format API ke format database
    const dbUpdates = {
      emailEnabled: updates.email !== undefined ? updates.email : settings?.emailEnabled,
      slackEnabled: updates.slack !== undefined ? updates.slack : settings?.slackEnabled,
      slackWebhookUrl: updates.slackWebhookUrl !== undefined ? updates.slackWebhookUrl : settings?.slackWebhookUrl,
      discordEnabled: updates.discord !== undefined ? updates.discord : settings?.discordEnabled,
      discordWebhookUrl: updates.discordWebhookUrl !== undefined ? updates.discordWebhookUrl : settings?.discordWebhookUrl,
      telegramEnabled: updates.telegram !== undefined ? updates.telegram : settings?.telegramEnabled,
      telegramBotToken: updates.telegramBotToken !== undefined ? updates.telegramBotToken : settings?.telegramBotToken,
      telegramChatId: updates.telegramChatId !== undefined ? updates.telegramChatId : settings?.telegramChatId,
      notifyOnNewError: updates.notifyOnNewError !== undefined ? updates.notifyOnNewError : settings?.notifyOnNewError,
      notifyOnResolvedError: updates.notifyOnResolvedError !== undefined ? updates.notifyOnResolvedError : settings?.notifyOnResolvedError,
      minimumErrorLevel: updates.minimumErrorLevel !== undefined ? updates.minimumErrorLevel : settings?.minimumErrorLevel
    };
    
    if (settings) {
      // Update existing settings
      await prisma.projectNotificationSettings.update({
        where: { projectId: id },
        data: dbUpdates
      });
    } else {
      // Create new settings
      await prisma.projectNotificationSettings.create({
        data: {
          projectId: id,
          ...dbUpdates
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Gagal memperbarui pengaturan notifikasi' });
  }
});

// Endpoint alternatif untuk patch
router.patch('/projects/:id/notifications/settings', authMiddleware, verifyAdminOrOwnerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Verifikasi project
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Periksa apakah settings sudah ada
    let settings = await prisma.projectNotificationSettings.findUnique({
      where: { projectId: id }
    });
    
    // Transform updates dari format API ke format database
    const dbUpdates = {
      emailEnabled: updates.email !== undefined ? updates.email : settings?.emailEnabled,
      slackEnabled: updates.slack !== undefined ? updates.slack : settings?.slackEnabled,
      slackWebhookUrl: updates.slackWebhookUrl !== undefined ? updates.slackWebhookUrl : settings?.slackWebhookUrl,
      discordEnabled: updates.discord !== undefined ? updates.discord : settings?.discordEnabled,
      discordWebhookUrl: updates.discordWebhookUrl !== undefined ? updates.discordWebhookUrl : settings?.discordWebhookUrl,
      telegramEnabled: updates.telegram !== undefined ? updates.telegram : settings?.telegramEnabled,
      telegramBotToken: updates.telegramBotToken !== undefined ? updates.telegramBotToken : settings?.telegramBotToken,
      telegramChatId: updates.telegramChatId !== undefined ? updates.telegramChatId : settings?.telegramChatId,
      notifyOnNewError: updates.notifyOnNewError !== undefined ? updates.notifyOnNewError : settings?.notifyOnNewError,
      notifyOnResolvedError: updates.notifyOnResolvedError !== undefined ? updates.notifyOnResolvedError : settings?.notifyOnResolvedError,
      minimumErrorLevel: updates.minimumErrorLevel !== undefined ? updates.minimumErrorLevel : settings?.minimumErrorLevel
    };
    
    if (settings) {
      // Update existing settings
      await prisma.projectNotificationSettings.update({
        where: { projectId: id },
        data: dbUpdates
      });
    } else {
      // Create new settings
      await prisma.projectNotificationSettings.create({
        data: {
          projectId: id,
          ...dbUpdates
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Gagal memperbarui pengaturan notifikasi' });
  }
});

/**
 * Test notification
 * POST /api/notifications/projects/:id/test
 */
router.post('/projects/:id/test', authMiddleware, verifyAdminOrOwnerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    
    if (!type || !['email', 'slack', 'whatsapp', 'discord', 'telegram'].includes(type)) {
      return res.status(400).json({ error: 'Tipe notifikasi tidak valid. Pilih email, slack, discord, telegram, atau whatsapp.' });
    }
    
    // Verifikasi project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Ambil settings
    const settings = await prisma.projectNotificationSettings.findUnique({
      where: { projectId: id }
    });
    
    if (!settings) {
      return res.status(400).json({ error: 'Pengaturan notifikasi belum dikonfigurasi' });
    }
    
    if (type === 'email') {
      // Jika email tidak aktif, kembalikan error
      if (!settings.emailEnabled) {
        return res.status(400).json({ error: 'Notifikasi email tidak diaktifkan' });
      }
      
      // Validasi Resend API key
      if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ 
          error: 'RESEND_API_KEY tidak ditemukan. Silakan periksa konfigurasi server.',
          details: 'Variabel lingkungan RESEND_API_KEY belum dikonfigurasi'
        });
      }
      
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      
      // Buat konten email
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">[Test] Notifikasi dari Project ${project.name}</h1>
          </div>
          
          <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
            <p>Ini adalah email test dari LogRaven</p>
            <p>Pengaturan notifikasi email untuk project <b>${project.name}</b> telah berhasil dikonfigurasi.</p>
            <p>Email ini dikirim sebagai konfirmasi bahwa sistem notifikasi berfungsi dengan baik.</p>
            <p>Timestamp: ${new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>
      `;
      
      const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const recipient = process.env.NODE_ENV === 'production' ? project.owner.email : 'delivered@resend.dev';
      
      console.log('Attempting to send test email with params:', {
        from: `LogRaven <${fromEmail}>`,
        to: recipient,
        subject: `[Test] Notifikasi dari LogRaven - Project ${project.name}`,
        htmlLength: html.length
      });
      
      // Kirim email menggunakan Resend
      try {
        const { data, error } = await resendClient.emails.send({
          from: `LogRaven <${fromEmail}>`,
          to: recipient,
          subject: `[Test] Notifikasi dari LogRaven - Project ${project.name}`,
          html: html
        });
        
        if (error) {
          console.error('Resend API Error:', JSON.stringify(error));
          return res.status(400).json({ 
            error: 'Gagal mengirim email test',
            details: error
          });
        }
        
        res.json({ 
          success: true, 
          message: `Email test berhasil dikirim ke ${recipient}`,
          id: data?.id
        });
      } catch (emailError: any) {
        console.error('Exception on Resend API call:', emailError);
        
        return res.status(500).json({ 
          error: 'Gagal mengirim email test: ' + (emailError.message || 'Unknown error'),
          details: {
            name: emailError.name,
            message: emailError.message,
            stack: process.env.NODE_ENV === 'development' ? emailError.stack : undefined
          }
        });
      }
    } else if (type === 'slack') {
      // Jika slack tidak aktif atau URL tidak ada, kembalikan error
      if (!settings.slackEnabled || !settings.slackWebhookUrl) {
        return res.status(400).json({ error: 'Notifikasi Slack tidak diaktifkan atau Webhook URL tidak dikonfigurasi' });
      }
      
      // Kirim notifikasi test ke Slack
      const response = await fetch(settings.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `[Test] Notifikasi dari Project ${project.name}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*[Test] Notifikasi dari Project ${project.name}*`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Pengaturan notifikasi Slack untuk project ini telah berhasil dikonfigurasi.'
              }
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error mengirim notifikasi ke Slack: ${response.statusText}`);
      }
      
      return res.json({ 
        success: true, 
        message: `Test notifikasi Slack sedang diproses`
      });
    } else if (type === 'discord') {
      // Jika discord tidak aktif atau URL tidak ada, kembalikan error
      if (!settings.discordEnabled || !settings.discordWebhookUrl) {
        return res.status(400).json({ error: 'Notifikasi Discord tidak diaktifkan atau Webhook URL tidak dikonfigurasi' });
      }
      
      // Kirim notifikasi test ke Discord
      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `[Test] Notifikasi dari Project ${project.name}`,
          embeds: [
            {
              title: `Test Notifikasi`,
              description: `Pengaturan notifikasi Discord untuk project "${project.name}" telah berhasil dikonfigurasi.`,
              color: 5814783, // Warna biru
              timestamp: new Date().toISOString()
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error mengirim notifikasi ke Discord: ${response.statusText}`);
      }
      
      return res.json({ 
        success: true, 
        message: `Test notifikasi Discord sedang diproses`
      });
    } else if (type === 'telegram') {
      // Jika telegram tidak aktif atau token/chatId tidak ada, kembalikan error
      if (!settings.telegramEnabled || !settings.telegramBotToken || !settings.telegramChatId) {
        return res.status(400).json({ error: 'Notifikasi Telegram tidak diaktifkan atau Bot Token/Chat ID tidak dikonfigurasi' });
      }
      
      // Kirim notifikasi test ke Telegram
      const message = `[Test] Notifikasi dari Project "${project.name}"\n\nPengaturan notifikasi Telegram untuk project ini telah berhasil dikonfigurasi.`;
      const telegramUrl = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
      
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error mengirim notifikasi ke Telegram: ${JSON.stringify(errorData)}`);
      }
      
      return res.json({
        success: true,
        message: `Test notifikasi Telegram sedang diproses`
      });
    } else if (type === 'whatsapp') {
      // WhatsApp belum diimplementasi
      return res.status(501).json({ 
        error: 'Notifikasi WhatsApp belum diimplementasikan',
        message: 'Fitur ini masih dalam pengembangan'
      });
    }
  } catch (err: any) {
    console.error('Error sending test notification:', err);
    res.status(500).json({ 
      error: `Gagal mengirim notifikasi test: ${err.message}`,
      details: process.env.NODE_ENV === 'development' ? err : undefined
    });
  }
});

// Endpoint untuk URL yang digunakan frontend
router.get('/projects/:id/:version/settings', authMiddleware, verifyAdminOrOwnerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifikasi project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Ambil settings dari database
    let settings = await prisma.projectNotificationSettings.findUnique({
      where: { projectId: id }
    });
    
    // Jika settings belum ada, buat default settings
    if (!settings) {
      settings = await prisma.projectNotificationSettings.create({
        data: {
          projectId: id,
          emailEnabled: false,
          slackEnabled: false,
          discordEnabled: false,
          telegramEnabled: false,
          notifyOnNewError: true,
          notifyOnResolvedError: false,
          minimumErrorLevel: 'error'
        }
      });
    }
    
    // Format data untuk respons API yang kompatibel dengan kode frontend yang sudah ada
    const formattedSettings = {
      email: settings.emailEnabled,
      slack: settings.slackEnabled,
      slackWebhookUrl: settings.slackWebhookUrl || '',
      discord: settings.discordEnabled,
      discordWebhookUrl: settings.discordWebhookUrl || '',
      telegram: settings.telegramEnabled,
      telegramBotToken: settings.telegramBotToken || '',
      telegramChatId: settings.telegramChatId || '',
      notifyOnNewError: settings.notifyOnNewError,
      notifyOnResolvedError: settings.notifyOnResolvedError,
      minimumErrorLevel: settings.minimumErrorLevel
    };
    
    res.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaturan notifikasi' });
  }
});

// Endpoint untuk URL yang digunakan frontend (PATCH)
router.patch('/projects/:id/:version/settings', authMiddleware, verifyAdminOrOwnerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Verifikasi project
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Periksa apakah settings sudah ada
    let settings = await prisma.projectNotificationSettings.findUnique({
      where: { projectId: id }
    });
    
    // Transform updates dari format API ke format database
    const dbUpdates = {
      emailEnabled: updates.email !== undefined ? updates.email : settings?.emailEnabled,
      slackEnabled: updates.slack !== undefined ? updates.slack : settings?.slackEnabled,
      slackWebhookUrl: updates.slackWebhookUrl !== undefined ? updates.slackWebhookUrl : settings?.slackWebhookUrl,
      discordEnabled: updates.discord !== undefined ? updates.discord : settings?.discordEnabled,
      discordWebhookUrl: updates.discordWebhookUrl !== undefined ? updates.discordWebhookUrl : settings?.discordWebhookUrl,
      telegramEnabled: updates.telegram !== undefined ? updates.telegram : settings?.telegramEnabled,
      telegramBotToken: updates.telegramBotToken !== undefined ? updates.telegramBotToken : settings?.telegramBotToken,
      telegramChatId: updates.telegramChatId !== undefined ? updates.telegramChatId : settings?.telegramChatId,
      notifyOnNewError: updates.notifyOnNewError !== undefined ? updates.notifyOnNewError : settings?.notifyOnNewError,
      notifyOnResolvedError: updates.notifyOnResolvedError !== undefined ? updates.notifyOnResolvedError : settings?.notifyOnResolvedError,
      minimumErrorLevel: updates.minimumErrorLevel !== undefined ? updates.minimumErrorLevel : settings?.minimumErrorLevel
    };
    
    if (settings) {
      // Update existing settings
      await prisma.projectNotificationSettings.update({
        where: { projectId: id },
        data: dbUpdates
      });
    } else {
      // Create new settings
      await prisma.projectNotificationSettings.create({
        data: {
          projectId: id,
          ...dbUpdates
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Gagal memperbarui pengaturan notifikasi' });
  }
});

// Debug endpoint untuk melihat log request
router.get('/debug-log', (req, res) => {
  res.json({
    requestLog,
    message: 'Endpoint ini hanya untuk debugging dan tidak untuk digunakan di produksi'
  });
});

// Tipe data untuk entry paths
interface RoutePathEntry {
  path: string;
  methods: string[];
}

router.get('/paths', (req, res) => {
  const paths: RoutePathEntry[] = [];
  
  // Dapatkan semua path yang terdaftar di router
  router.stack.forEach(layer => {
    if (layer.route) {
      const path = layer.route.path;
      
      // Gunakan type assertion karena kita tahu struktur internal Express router
      const route = layer.route as any;
      const routeMethods = route.methods ? 
        Object.keys(route.methods).map(method => method.toUpperCase()) : 
        [];
      
      paths.push({ 
        path, 
        methods: routeMethods 
      });
    }
  });
  
  res.json({
    message: 'Daftar path yang terdaftar pada notification router',
    paths
  });
});

export default router; 