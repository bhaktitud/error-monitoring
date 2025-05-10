import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /plans - daftar semua plan
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data plan' });
  }
});

// GET /plans/:id - detail plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id },
    });
    if (!plan) return res.status(404).json({ error: 'Plan tidak ditemukan' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail plan' });
  }
});

// POST /plans/upgrade - upgrade/downgrade plan user
// Body: { userId, planId }
router.post('/upgrade', async (req, res) => {
  const { userId, planId } = req.body;
  if (!userId || !planId) return res.status(400).json({ error: 'userId dan planId wajib diisi' });
  try {
    // Ambil user dan plan lama
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Plan tidak ditemukan' });

    // Update plan user
    await prisma.user.update({
      where: { id: userId },
      data: { planId: planId },
    });

    // Catat di PlanHistory
    await prisma.planHistory.create({
      data: {
        userId,
        planId,
        startDate: new Date(),
        action: user.planId === planId ? 'refresh' : (user.planId ? 'upgrade/downgrade' : 'set'),
        note: null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal update plan user' });
  }
});

export default router; 