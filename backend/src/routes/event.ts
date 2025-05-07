import express from 'express';
import prisma from '../models/prisma';
import { sendErrorNotification } from '../utils/email';

const router = express.Router();

// Terima event/error dari SDK
router.post('/', async (req, res) => {
  const dsn = req.headers['x-dsn'] as string;
  const { errorType, message, stacktrace, userAgent } = req.body;
  if (!dsn || !errorType || !message) return res.status(400).json({ error: 'Data tidak lengkap' });
  try {
    const project = await prisma.project.findUnique({ where: { dsn } });
    if (!project) return res.status(404).json({ error: 'Project tidak ditemukan' });
    await prisma.event.create({
      data: {
        projectId: project.id,
        errorType,
        message,
        stacktrace,
        userAgent,
      }
    });
    // Kirim email ke owner project
    const owner = await prisma.user.findUnique({ where: { id: project.ownerId } });
    if (owner) {
      sendErrorNotification(
        owner.email,
        project.name,
        message,
        errorType,
        new Date().toLocaleString()
      ).catch(() => {});
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

export default router; 