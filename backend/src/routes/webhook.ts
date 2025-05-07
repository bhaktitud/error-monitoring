import express from 'express';
import prisma from '../models/prisma';

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

export default router; 