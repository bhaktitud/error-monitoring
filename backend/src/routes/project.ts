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

export { auth };

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

// List member project
router.get('/:id/members', auth, async (req: any, res) => {
  const { id } = req.params;
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { role: 'asc' }
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil member project' });
  }
});

// Invite/tambah member ke project
router.post('/:id/members', auth, async (req: any, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: 'Email dan role wajib diisi' });
  try {
    // Cek apakah requester adalah owner/admin
    const me = await prisma.projectMember.findFirst({ where: { projectId: id, userId: req.user.userId } });
    if (!me || (me.role !== 'admin' && me.role !== 'owner')) return res.status(403).json({ error: 'Hanya owner/admin yang bisa invite' });
    // Cari user by email
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, passwordHash: '' } }); // dummy user, password kosong
    }
    // Cek apakah sudah jadi member
    const exist = await prisma.projectMember.findFirst({ where: { projectId: id, userId: user.id } });
    if (exist) return res.status(409).json({ error: 'User sudah jadi member' });
    // Tambah member
    const member = await prisma.projectMember.create({ data: { projectId: id, userId: user.id, role }, include: { user: { select: { id: true, email: true } } } });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: 'Gagal invite member' });
  }
});

// Edit role member
router.patch('/:id/members/:memberId', auth, async (req: any, res) => {
  const { id, memberId } = req.params;
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role wajib diisi' });
  try {
    // Cek admin/owner
    const me = await prisma.projectMember.findFirst({ where: { projectId: id, userId: req.user.userId } });
    if (!me || (me.role !== 'admin' && me.role !== 'owner')) return res.status(403).json({ error: 'Hanya owner/admin yang bisa edit role' });
    const member = await prisma.projectMember.update({ where: { id: memberId }, data: { role }, include: { user: { select: { id: true, email: true } } } });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update role member' });
  }
});

// Hapus member
router.delete('/:id/members/:memberId', auth, async (req: any, res) => {
  const { id, memberId } = req.params;
  try {
    // Cek admin/owner
    const me = await prisma.projectMember.findFirst({ where: { projectId: id, userId: req.user.userId } });
    if (!me || (me.role !== 'admin' && me.role !== 'owner')) return res.status(403).json({ error: 'Hanya owner/admin yang bisa hapus member' });
    await prisma.projectMember.delete({ where: { id: memberId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus member' });
  }
});

export default router; 