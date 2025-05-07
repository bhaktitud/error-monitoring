import express from 'express';
import prisma from '../models/prisma';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware autentikasi
function auth(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = payload;
    next();
  } catch {
    res.sendStatus(403);
  }
}

// Buat project baru
router.post('/', auth, async (req: any, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama project wajib diisi' });
  try {
    const dsn = uuidv4();
    const project = await prisma.project.create({
      data: {
        name,
        ownerId: req.user.userId,
        dsn,
        members: {
          create: [{ userId: req.user.userId, role: 'admin' }]
        }
      }
    });
    res.status(201).json({ id: project.id, name: project.name, dsn: project.dsn });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat project' });
  }
});

// List project milik user
router.get('/', auth, async (req: any, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: req.user.userId } }
      },
      select: { id: true, name: true, dsn: true, createdAt: true }
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil project' });
  }
});

export default router; 