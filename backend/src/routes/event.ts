import express from 'express';
import prisma from '../models/prisma';
import { sendErrorNotification } from '../utils/email';
import axios from 'axios';
import { PlanFeatures } from '../types/plan';
import { ErrorGroupingService } from '../services/errorGroupingService';
import { NotificationService } from '../services/notificationService';
import crypto from 'crypto';

const router = express.Router();
const errorGroupingService = new ErrorGroupingService();

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
    extraContext 
  } = req.body;
  
  if (!dsn || !errorType || !message) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  
  try {
    // Cari project berdasarkan DSN
    const project = await prisma.project.findUnique({ where: { dsn } });
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Validasi kuota events bulanan
    const owner = await prisma.user.findUnique({ 
      where: { id: project.ownerId }, 
      include: { plan: true } 
    });
    
    const features = owner?.plan?.features as PlanFeatures | null;
    const kuota = features?.eventsPerMonth || 1000;
    
    const awalBulan = new Date();
    awalBulan.setDate(1); 
    awalBulan.setHours(0,0,0,0);
    
    const totalEvents = await prisma.event.count({
      where: {
        projectId: project.id,
        timestamp: { gte: awalBulan }
      }
    });
    
    if (totalEvents >= kuota) {
      return res.status(403).json({ error: 'Kuota events bulanan Anda sudah habis.' });
    }
    
    // Gunakan layanan error grouping untuk mengelompokkan error
    const groupId = await errorGroupingService.groupError({
      projectId: project.id,
      errorType,
      message,
      stacktrace,
      statusCode,
      userAgent,
      userContext,
      tags,
      url,
      browser,
      os
    });
    
    // Simpan event dengan referensi ke group
    const event = await prisma.event.create({
      data: {
        projectId: project.id,
        errorType,
        message,
        stacktrace,
        userAgent,
        groupId,
        statusCode: statusCode ?? null,
        userContext: userContext ?? null,
        tags: tags ?? null,
      }
    });
    
    // Kirim notifikasi (email dan in-app)
    if (owner) {
      try {
        // Email notification
        await sendErrorNotification(
          owner.email,
          project.name,
          message,
          errorType,
          new Date().toLocaleString()
        );
        
        // In-app notification
        const io = req.app.get('io');
        if (io) {
          const notificationService = new NotificationService(io);
          await notificationService.createNotification({
            userId: owner.id,
            type: 'error',
            title: `Error di ${project.name}`,
            message: `${errorType}: ${message}`,
            data: {
              projectId: project.id,
              errorGroupId: groupId,
              error: {
                errorType,
                message,
                environment: tags?.environment || 'production',
                browser,
                os,
                url
              }
            }
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    }
    
    // Kirim webhook ke endpoint custom user
    try {
      const webhooks = await prisma.webhook.findMany({ 
        where: { projectId: project.id, enabled: true } 
      });
      
      for (const webhook of webhooks) {
        try {
          const payload = {
            projectId: project.id,
            eventId: event.id,
            errorGroupId: groupId,
            errorType,
            message,
            statusCode: statusCode ?? null,
            timestamp: new Date().toISOString(),
            userContext: userContext ?? null,
            tags: tags ?? null,
            browser,
            os,
            url,
            deviceType
          };
          
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          
          if (webhook.secret) {
            const signature = crypto.createHmac('sha256', webhook.secret)
              .update(JSON.stringify(payload))
              .digest('hex');
            headers['x-webhook-signature'] = signature;
          }
          
          // Buat log webhook delivery - request
          const deliveryLog = await prisma.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              eventId: event.id,
              requestBody: JSON.stringify(payload),
              success: false, // Akan diupdate setelah mendapat response
            },
          });
  
          try {
            const sentAt = new Date();
            const response = await axios.post(webhook.url, payload, { headers });
            const responseAt = new Date();
            
            // Update log dengan response
            await prisma.webhookDelivery.update({
              where: { id: deliveryLog.id },
              data: {
                responseBody: JSON.stringify(response.data),
                statusCode: response.status,
                success: true,
                responseAt,
              },
            });
          } catch (error: any) {
            // Update log dengan error
            await prisma.webhookDelivery.update({
              where: { id: deliveryLog.id },
              data: {
                error: error.message || 'Gagal mengirimkan webhook',
                statusCode: error.response?.status,
                success: false,
                responseBody: error.response ? JSON.stringify(error.response.data) : null,
                responseAt: new Date(),
              },
            });
          }
        } catch (err) {
          // Error saat membuat atau mengupdate log
          console.error('Gagal membuat log webhook:', err);
        }
      }
    } catch (webhookError) {
      console.error('Error processing webhooks:', webhookError);
    }
    
    res.status(201).json({ success: true, eventId: event.id, groupId });
    
  } catch (err) {
    console.error('Error saving event:', err);
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