import express from 'express';
import prisma from '../models/prisma';
import { authMiddleware } from '../utils/auth';
import nodemailer from 'nodemailer';

const router = express.Router();

// Simpan setting notifikasi dalam in-memory untuk prototype
// Dalam produksi sebaiknya disimpan di database
const notificationSettings = new Map<string, {
  email: boolean;
  slack: boolean;
  slackWebhookUrl?: string;
  notifyOnNewError: boolean;
  notifyOnResolvedError: boolean;
  minimumErrorLevel: 'info' | 'warning' | 'error' | 'fatal';
}>();

// Default settings untuk project baru
const getDefaultSettings = () => ({
  email: false,
  slack: false,
  slackWebhookUrl: '',
  notifyOnNewError: true,
  notifyOnResolvedError: false,
  minimumErrorLevel: 'error'
});

let requestLog = [];

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

/**
 * Get notification settings
 * GET /api/notifications/projects/:id/settings
 */
router.get('/notifications/projects/:id/settings', authMiddleware, async (req, res) => {
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
    
    // Ambil settings dari memory atau default
    const settings = notificationSettings.get(id) || getDefaultSettings();
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaturan notifikasi' });
  }
});

// Endpoint alternatif dengan path yang berbeda untuk berjaga-jaga
router.get('/projects/:id/notifications/settings', authMiddleware, async (req, res) => {
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
    
    // Ambil settings dari memory atau default
    const settings = notificationSettings.get(id) || getDefaultSettings();
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaturan notifikasi' });
  }
});

/**
 * Update notification settings
 * PATCH /api/notifications/projects/:id/settings
 */
router.patch('/notifications/projects/:id/settings', authMiddleware, async (req, res) => {
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
    
    // Ambil settings yang ada atau default
    const currentSettings = notificationSettings.get(id) || getDefaultSettings();
    
    // Update settings
    const newSettings = {
      ...currentSettings,
      ...updates
    };
    
    // Simpan ke memory
    notificationSettings.set(id, newSettings);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Gagal memperbarui pengaturan notifikasi' });
  }
});

// Endpoint alternatif untuk patch
router.patch('/projects/:id/notifications/settings', authMiddleware, async (req, res) => {
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
    
    // Ambil settings yang ada atau default
    const currentSettings = notificationSettings.get(id) || getDefaultSettings();
    
    // Update settings
    const newSettings = {
      ...currentSettings,
      ...updates
    };
    
    // Simpan ke memory
    notificationSettings.set(id, newSettings);
    
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
router.post('/notifications/projects/:id/test', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    
    if (!type || !['email', 'slack'].includes(type)) {
      return res.status(400).json({ error: 'Tipe notifikasi tidak valid' });
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
    const settings = notificationSettings.get(id) || getDefaultSettings();
    
    if (type === 'email') {
      // Jika email tidak aktif, kembalikan error
      if (!settings.email) {
        return res.status(400).json({ error: 'Notifikasi email tidak diaktifkan' });
      }
      
      // Setup SMTP transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: Number(process.env.SMTP_PORT) || 2525,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      });
      
      // Kirim email test
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@sentry-clone.com',
        to: project.owner.email,
        subject: `[Test] Notifikasi Error dari Project ${project.name}`,
        html: `
          <h2>Ini adalah email test dari Sentry Clone</h2>
          <p>Pengaturan notifikasi email untuk project <b>${project.name}</b> telah berhasil dikonfigurasi.</p>
          <p>Email ini dikirim sebagai konfirmasi bahwa sistem notifikasi berfungsi dengan baik.</p>
        `
      });
    } else if (type === 'slack') {
      // Jika slack tidak aktif atau URL tidak ada, kembalikan error
      if (!settings.slack || !settings.slackWebhookUrl) {
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
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Gagal mengirim notifikasi test' });
  }
});

// Endpoint alternatif untuk test notification
router.post('/projects/:id/notifications/test', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    
    if (!type || !['email', 'slack'].includes(type)) {
      return res.status(400).json({ error: 'Tipe notifikasi tidak valid' });
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
    const settings = notificationSettings.get(id) || getDefaultSettings();
    
    if (type === 'email') {
      // Jika email tidak aktif, kembalikan error
      if (!settings.email) {
        return res.status(400).json({ error: 'Notifikasi email tidak diaktifkan' });
      }
      
      // Setup SMTP transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: Number(process.env.SMTP_PORT) || 2525,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      });
      
      // Kirim email test
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@sentry-clone.com',
        to: project.owner.email,
        subject: `[Test] Notifikasi Error dari Project ${project.name}`,
        html: `
          <h2>Ini adalah email test dari Sentry Clone</h2>
          <p>Pengaturan notifikasi email untuk project <b>${project.name}</b> telah berhasil dikonfigurasi.</p>
          <p>Email ini dikirim sebagai konfirmasi bahwa sistem notifikasi berfungsi dengan baik.</p>
        `
      });
    } else if (type === 'slack') {
      // Jika slack tidak aktif atau URL tidak ada, kembalikan error
      if (!settings.slack || !settings.slackWebhookUrl) {
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
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Gagal mengirim notifikasi test' });
  }
});

// Debug endpoint untuk melihat log request
router.get('/debug-log', (req, res) => {
  res.json({
    requestLog,
    message: 'Endpoint ini hanya untuk debugging dan tidak untuk digunakan di produksi'
  });
});

router.get('/paths', (req, res) => {
  const paths = [];
  
  // Dapatkan semua path yang terdaftar di router
  router.stack.forEach(layer => {
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods).map(method => method.toUpperCase());
      paths.push({ path, methods });
    }
  });
  
  res.json({
    message: 'Daftar path yang terdaftar pada notification router',
    paths
  });
});

export default router; 