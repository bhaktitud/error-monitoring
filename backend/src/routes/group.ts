import express from 'express';
import prisma from '../models/prisma';
import { auth } from './project';
import projectRoutes from './project';

const router = express.Router();

// List error group per project
router.get('/projects/:id/groups', async (req, res) => {
  const { id } = req.params;
  try {
    const groups = await prisma.errorGroup.findMany({
      where: { projectId: id },
      orderBy: { lastSeen: 'desc' },
      select: {
        id: true,
        errorType: true,
        message: true,
        count: true,
        firstSeen: true,
        lastSeen: true,
        statusCode: true,
        status: true,
        assignedTo: true,
        updatedAt: true,
      }
    });
    res.json(groups);
  } catch {
    res.status(500).json({ error: 'Gagal mengambil group' });
  }
});

// List event dalam group
router.get('/groups/:groupId/events', async (req, res) => {
  const { groupId } = req.params;
  try {
    const events = await prisma.event.findMany({
      where: { groupId },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Gagal mengambil event group' });
  }
});

// Update status group
router.patch('/groups/:groupId/status', auth, async (req, res) => {
  const { groupId } = req.params;
  const { status } = req.body;
  if (!['open', 'resolved', 'ignored'].includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
  try {
    const group = await prisma.errorGroup.update({
      where: { id: groupId },
      data: { status }
    });
    res.json(group);
  } catch {
    res.status(500).json({ error: 'Gagal update status group' });
  }
});

// Assign/unassign group ke ProjectMember
router.patch('/groups/:groupId/assign', auth, async (req: any, res) => {
  const { groupId } = req.params;
  const { memberId } = req.body; // ProjectMember.id atau null untuk unassign
  try {
    const group = await prisma.errorGroup.update({
      where: { id: groupId },
      data: { assignedTo: memberId || null }
    });
    res.json(group);
  } catch {
    res.status(500).json({ error: 'Gagal assign group' });
  }
});

// List komentar group
router.get('/groups/:groupId/comments', async (req, res) => {
  const { groupId } = req.params;
  try {
    const comments = await prisma.errorGroupComment.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      include: { author: { include: { user: true } } }
    });
    res.json(comments);
  } catch {
    res.status(500).json({ error: 'Gagal mengambil komentar' });
  }
});

// Tambah komentar group
router.post('/groups/:groupId/comments', auth, async (req: any, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Komentar wajib diisi' });
  try {
    // Cari ProjectMember id user di project ini
    const group = await prisma.errorGroup.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Group tidak ditemukan' });
    const member = await prisma.projectMember.findFirst({ where: { projectId: group.projectId, userId: req.user.userId } });
    if (!member) return res.status(403).json({ error: 'Bukan member project' });
    const comment = await prisma.errorGroupComment.create({
      data: { groupId, authorId: member.id, content }
    });
    // Ambil komentar lengkap dengan relasi author + user
    const fullComment = await prisma.errorGroupComment.findUnique({
      where: { id: comment.id },
      include: { author: { include: { user: true } } }
    });
    res.status(201).json(fullComment);
  } catch {
    res.status(500).json({ error: 'Gagal tambah komentar' });
  }
});

export default router; 