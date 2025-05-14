import express from 'express';
import prisma from '../models/prisma';
import { sendErrorNotification } from '../utils/email';
import axios from 'axios';
import { PlanFeatures } from '../types/plan';
import { ErrorGroupingService } from '../services/errorGroupingService';
import { NotificationService } from '../services/notificationService';
import { transformStackTrace } from '../utils/sourcemap';
import crypto from 'crypto';

const router = express.Router();
const errorGroupingService = new ErrorGroupingService();

// Fungsi untuk menghasilkan kode unik event
function generateEventCode(): string {
  return crypto.randomBytes(8).toString('hex');
}

// Terima event/error dari SDK
router.post('/', async (req, res) => {
  const dsn = req.headers['x-dsn'] as string;
  const { 
    errorType, 
    message, 
    stacktrace, 
    userAgent, 
    statusCode, 
    userContext, 
    tags, 
    os, 
    osVersion, 
    browser, 
    browserVersion, 
    deviceType, 
    url, 
    path, 
    query, 
    method, 
    extraContext,
    release,
    environment,
    params,
    headers,
    ip,
    language,
    referrer,
    screenSize
  } = req.body;
  
  if (!dsn || !errorType || !message) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  
  try {
    const project = await prisma.project.findUnique({
      where: {
        dsn
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'DSN tidak valid' });
    }

    // Cek apakah project owner ada dan aktif
    const projectOwner = await prisma.user.findUnique({
      where: { id: project.ownerId },
      include: { plan: true }
    });

    if (!projectOwner) {
      return res.status(404).json({ error: 'Project owner tidak ditemukan' });
    }

    // Transformasi stacktrace jika ada release dan terdapat sourcemap
    let processedStacktrace = stacktrace;
    if (release) {
      try {
        processedStacktrace = await transformStackTrace(project.id, release, stacktrace);
      } catch (error) {
        console.error('Error transforming stacktrace:', error);
        // Lanjutkan dengan stacktrace asli jika transformasi gagal
      }
    }

    // Group error berdasarkan type dan message
    const errorGroupResult = await errorGroupingService.groupError({
      projectId: project.id,
      errorType,
      message,
      statusCode
    });

    const errorGroup = errorGroupResult.errorGroup;
    const isNewGroup = errorGroupResult.isNewGroup;

    // Simpan event ke database dengan properti standar
    const event = await prisma.event.create({
      data: {
        projectId: project.id,
        groupId: errorGroup.id,
        errorType,
        message,
        stacktrace: processedStacktrace,
        userAgent,
        statusCode,
        userContext,
        tags,
        os,
        osVersion,
        browser,
        browserVersion,
        deviceType,
        environment,
        release,
        code: generateEventCode()
      }
    });

    // Perbarui event jika ada properti tambahan
    if (url || method || path || query || params || headers || ip || language || referrer || screenSize) {
      try {
        // Buat object dengan properti yang perlu diupdate
        const updatedFields: any = {};
        if (url) updatedFields.url = url;
        if (method) updatedFields.method = method;
        if (path) updatedFields.path = path;
        if (query) updatedFields.query = query;
        if (params) updatedFields.params = params;
        if (headers) updatedFields.headers = headers;
        if (ip) updatedFields.ip = ip;
        if (language) updatedFields.language = language;
        if (referrer) updatedFields.referrer = referrer;
        if (screenSize) updatedFields.screenSize = screenSize;

        // Update database
        await prisma.event.update({
          where: { id: event.id },
          data: updatedFields
        });
      } catch (updateError) {
        console.error('Error updating event with additional fields:', updateError);
        // Lanjutkan meskipun gagal update field tambahan
      }
    }

    // Jika grup error baru, kirim notifikasi
    if (isNewGroup) {
      // Kirim email notifikasi jika user setting mengizinkan
      if (projectOwner.notifyEmail) {
        sendErrorNotification(projectOwner.email, {
          projectName: project.name,
          errorType,
          message,
          count: 1,
          url: `${process.env.FRONTEND_URL}/projects/${project.id}/groups/${errorGroup.id}`
        }).catch(console.error);
      }

      // Buat notifikasi in-app
      if (projectOwner.notifyInApp) {
        try {
          await NotificationService.createErrorNotification(
            projectOwner.id,
            project.id,
            errorGroup.id,
            errorType,
            message
          );
        } catch (error) {
          console.error('Error creating in-app notification:', error);
        }
      }
    }

    // Kirim event ke webhook jika ada
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId: project.id,
        enabled: true
      }
    });

    for (const webhook of webhooks) {
      try {
        const payload = {
          projectId: project.id,
          eventId: event.id,
          errorType,
          message,
          statusCode,
          timestamp: event.timestamp,
          userContext,
          tags,
          groupId: errorGroup.id,
          url,
          environment,
          release
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        // Tambahkan signature jika webhook memiliki secret
        if (webhook.secret) {
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex');

          headers['x-webhook-signature'] = signature;
        }

        // Kirim webhook secara asynchronous (tidak menunggu response)
        axios.post(webhook.url, payload, { headers })
          .then(async (response) => {
            // Catat delivery sebagai sukses
            await prisma.webhookDelivery.create({
              data: {
                webhookId: webhook.id,
                eventId: event.id,
                requestBody: JSON.stringify(payload),
                responseBody: JSON.stringify(response.data),
                statusCode: response.status,
                success: true,
                responseAt: new Date()
              }
            });
          })
          .catch(async (error) => {
            // Catat delivery sebagai gagal
            await prisma.webhookDelivery.create({
              data: {
                webhookId: webhook.id,
                eventId: event.id,
                requestBody: JSON.stringify(payload),
                error: error.message,
                success: false
              }
            });
          });
      } catch (error) {
        console.error(`Error sending to webhook ${webhook.id}:`, error);
      }
    }

    res.status(201).json({ 
      success: true,
      eventId: event.id
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Gagal menyimpan event' });
  }
});

// Ambil daftar event per project
router.get('/project/:id', async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  
  try {
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { projectId: id },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          group: {
            select: {
              id: true,
              errorType: true,
              status: true,
              count: true
            }
          }
        }
      }),
      prisma.event.count({ where: { projectId: id } })
    ]);
    
    res.json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Gagal mengambil event' });
  }
});

// Ambil detail event
router.get('/:eventId', async (req, res) => {
  const { eventId } = req.params;
  
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: true,
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    res.json(event);
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).json({ error: 'Gagal mengambil detail event' });
  }
});

// Ambil usage events bulan ini untuk project tertentu
router.get('/usage/:projectId', async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    const owner = await prisma.user.findUnique({ 
      where: { id: project.ownerId }, 
      include: { plan: true } 
    });
    
    const features = owner?.plan?.features as PlanFeatures | null;
    const quota = features?.eventsPerMonth || 1000;
    
    const awalBulan = new Date();
    awalBulan.setDate(1); 
    awalBulan.setHours(0,0,0,0);
    
    const totalEvents = await prisma.event.count({
      where: {
        projectId,
        timestamp: { gte: awalBulan }
      }
    });
    
    const percent = Math.min(100, Math.round((totalEvents / quota) * 100));
    
    // Tambahkan data statistik error dari error grouping service
    const stats = await errorGroupingService.getErrorStats(projectId, 'month');
    
    res.json({ 
      totalEvents, 
      quota, 
      percent,
      stats
    });
  } catch (err) {
    console.error('Error fetching event usage:', err);
    res.status(500).json({ error: 'Gagal mengambil usage events' });
  }
});

export default router; 