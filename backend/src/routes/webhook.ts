import express from 'express';
import prisma from '../models/prisma';
import crypto from 'crypto';
import axios from 'axios';
import { PlanFeatures } from '../types/plan';

const router = express.Router();

// List webhook per project
router.get('/projects/:id/webhooks', async (req, res) => {
  const { id } = req.params;
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(webhooks);
  } catch {
    res.status(500).json({ error: 'Gagal mengambil webhook' });
  }
});

// Create webhook
router.post('/projects/:id/webhooks', async (req, res) => {
  const { id } = req.params;
  const { url, enabled, eventType, secret } = req.body;
  if (!url) return res.status(400).json({ error: 'URL wajib diisi' });
  try {
    // Ambil project dan owner beserta plan
    const project = await prisma.project.findUnique({ where: { id }, include: { owner: { include: { plan: true } } } });
    if (!project) return res.status(404).json({ error: 'Project tidak ditemukan' });
    const features = project.owner.plan?.features as unknown as PlanFeatures || {};
    const maxWebhooks = typeof features.webhook === 'number' ? features.webhook : (features.webhook === true ? 1 : 0);
    const webhooksCount = await prisma.webhook.count({ where: { projectId: id } });
    if (webhooksCount >= maxWebhooks) {
      return res.status(403).json({ error: 'Batas maksimal webhook pada plan Anda telah tercapai.' });
    }
    const webhook = await prisma.webhook.create({
      data: { projectId: id, url, enabled: enabled ?? true, eventType, secret }
    });
    res.status(201).json(webhook);
  } catch {
    res.status(500).json({ error: 'Gagal membuat webhook' });
  }
});

// Update webhook
router.put('/webhooks/:webhookId', async (req, res) => {
  const { webhookId } = req.params;
  const { url, enabled, eventType, secret } = req.body;
  try {
    const webhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: { url, enabled, eventType, secret }
    });
    res.json(webhook);
  } catch {
    res.status(500).json({ error: 'Gagal update webhook' });
  }
});

// Delete webhook
router.delete('/webhooks/:webhookId', async (req, res) => {
  const { webhookId } = req.params;
  try {
    await prisma.webhook.delete({ where: { id: webhookId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Gagal hapus webhook' });
  }
});

// Get webhook delivery logs
router.get('/webhooks/:webhookId/deliveries', async (req, res) => {
  const { webhookId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webhookDelivery.count({ where: { webhookId } }),
    ]);

    res.json({
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    res.status(500).json({ error: 'Gagal mengambil log webhook' });
  }
});

// Get delivery detail
router.get('/webhook-deliveries/:deliveryId', async (req, res) => {
  const { deliveryId } = req.params;
  try {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });
    
    if (!delivery) {
      return res.status(404).json({ error: 'Log webhook tidak ditemukan' });
    }
    
    res.json(delivery);
  } catch {
    res.status(500).json({ error: 'Gagal mengambil detail log webhook' });
  }
});

// Retry webhook delivery
router.post('/webhook-deliveries/:deliveryId/retry', async (req, res) => {
  const { deliveryId } = req.params;
  
  try {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });
    
    if (!delivery) {
      return res.status(404).json({ error: 'Log webhook tidak ditemukan' });
    }
    
    // Parse request body dari log sebelumnya
    const payload = JSON.parse(delivery.requestBody);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (delivery.webhook.secret) {
      const signature = crypto.createHmac('sha256', delivery.webhook.secret)
        .update(delivery.requestBody)
        .digest('hex');
      headers['x-webhook-signature'] = signature;
    }
    
    // Buat log baru untuk retry
    const newDelivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: delivery.webhookId,
        eventId: delivery.eventId,
        requestBody: delivery.requestBody,
        success: false,
      },
    });
    
    try {
      const sentAt = new Date();
      const response = await axios.post(delivery.webhook.url, payload, { headers });
      const responseAt = new Date();
      
      // Update log dengan response
      await prisma.webhookDelivery.update({
        where: { id: newDelivery.id },
        data: {
          responseBody: JSON.stringify(response.data),
          statusCode: response.status,
          success: true,
          responseAt,
        },
      });
      
      res.json({
        success: true,
        delivery: await prisma.webhookDelivery.findUnique({ where: { id: newDelivery.id } }),
      });
    } catch (error: any) {
      // Update log dengan error
      await prisma.webhookDelivery.update({
        where: { id: newDelivery.id },
        data: {
          error: error.message || 'Gagal mengirimkan webhook',
          statusCode: error.response?.status,
          success: false,
          responseBody: error.response ? JSON.stringify(error.response.data) : null,
          responseAt: new Date(),
        },
      });
      
      res.status(500).json({
        success: false,
        error: 'Gagal mengirim ulang webhook',
        delivery: await prisma.webhookDelivery.findUnique({ where: { id: newDelivery.id } }),
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Gagal memproses permintaan retry' });
  }
});

export default router; 