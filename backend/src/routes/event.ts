import express from 'express';
import prisma from '../models/prisma';
import { sendErrorNotification } from '../utils/email';
import crypto from 'crypto';
import axios from 'axios';
import { PlanFeatures } from '../types/plan';

const router = express.Router();

// Terima event/error dari SDK
router.post('/', async (req, res) => {
  const dsn = req.headers['x-dsn'] as string;
  const { errorType, message, stacktrace, userAgent, statusCode, userContext, tags } = req.body;
  if (!dsn || !errorType || !message) return res.status(400).json({ error: 'Data tidak lengkap' });
  try {
    const project = await prisma.project.findUnique({ where: { dsn } });
    if (!project) return res.status(404).json({ error: 'Project tidak ditemukan' });
    // Validasi kuota events bulanan
    const owner = await prisma.user.findUnique({ where: { id: project.ownerId }, include: { plan: true } });
    const features = owner?.plan?.features as PlanFeatures | null;
    const kuota = features?.eventsPerMonth || 1000;
    const awalBulan = new Date();
    awalBulan.setDate(1); awalBulan.setHours(0,0,0,0);
    const totalEvents = await prisma.event.count({
      where: {
        projectId: project.id,
        timestamp: { gte: awalBulan }
      }
    });
    if (totalEvents >= kuota) {
      return res.status(403).json({ error: 'Kuota events bulanan Anda sudah habis.' });
    }
    // Hitung fingerprint
    const fingerprint = crypto.createHash('sha256')
      .update(project.id + errorType + message + (stacktrace || '') + (statusCode || ''))
      .digest('hex');
    // Cari atau buat ErrorGroup
    let group = await prisma.errorGroup.findUnique({
      where: { projectId_fingerprint: { projectId: project.id, fingerprint } }
    });
    if (group) {
      group = await prisma.errorGroup.update({
        where: { id: group.id },
        data: {
          count: { increment: 1 },
          lastSeen: new Date(),
        }
      });
    } else {
      group = await prisma.errorGroup.create({
        data: {
          projectId: project.id,
          fingerprint,
          errorType,
          message,
          count: 1,
          firstSeen: new Date(),
          lastSeen: new Date(),
          statusCode: statusCode ?? null,
        }
      });
    }
    await prisma.event.create({
      data: {
        projectId: project.id,
        errorType,
        message,
        stacktrace,
        userAgent,
        groupId: group.id,
        statusCode: statusCode ?? null,
        userContext: userContext ?? null,
        tags: tags ?? null,
      }
    });
    // Kirim email ke owner project
    if (owner) {
      sendErrorNotification(
        owner.email,
        project.name,
        message,
        errorType,
        new Date().toLocaleString()
      ).catch(() => {});
    }
    // Kirim webhook ke endpoint custom user
    const webhooks = await prisma.webhook.findMany({ where: { projectId: project.id, enabled: true } });
    for (const webhook of webhooks) {
      try {
        const payload = {
          projectId: project.id,
          eventId: group.id,
          errorType,
          message,
          statusCode: statusCode ?? null,
          timestamp: new Date().toISOString(),
          userContext: userContext ?? null,
          tags: tags ?? null,
        };
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (webhook.secret) {
          const signature = crypto.createHmac('sha256', webhook.secret).update(JSON.stringify(payload)).digest('hex');
          headers['x-webhook-signature'] = signature;
        }
        
        // Buat log webhook delivery - request
        const deliveryLog = await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            eventId: group.id,
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
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan event' });
  }
});

// Ambil daftar event per project
router.get('/project/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const events = await prisma.event.findMany({
      where: { projectId: id },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil event' });
  }
});

// Ambil usage events bulan ini untuk project tertentu
router.get('/usage/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project tidak ditemukan' });
    const owner = await prisma.user.findUnique({ where: { id: project.ownerId }, include: { plan: true } });
    const features = owner?.plan?.features as PlanFeatures | null;
    const quota = features?.eventsPerMonth || 1000;
    const awalBulan = new Date();
    awalBulan.setDate(1); awalBulan.setHours(0,0,0,0);
    const totalEvents = await prisma.event.count({
      where: {
        projectId,
        timestamp: { gte: awalBulan }
      }
    });
    const percent = Math.min(100, Math.round((totalEvents / quota) * 100));
    res.json({ totalEvents, quota, percent });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil usage events' });
  }
});

export default router; 