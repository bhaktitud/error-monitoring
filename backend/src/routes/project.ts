import express from 'express';
import prisma from '../models/prisma';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { PlanFeatures } from '../types/plan';

const router = express.Router();

// Inisialisasi Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

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
    // Ambil data user beserta plan
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { plan: true } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    const features = user.plan?.features as unknown as PlanFeatures || {};
    const maxProjects = features.projects ?? 1;
    const userProjectsCount = await prisma.project.count({ where: { ownerId: req.user.userId } });
    if (userProjectsCount >= maxProjects) {
      return res.status(403).json({ error: 'Batas maksimal project pada plan Anda telah tercapai.' });
    }
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
    // Proyek yang user miliki (owner)
    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: req.user.userId },
      select: { id: true, name: true, dsn: true, createdAt: true }
    });
    // Proyek di mana user hanya sebagai member (bukan owner)
    const invitedProjects = await prisma.project.findMany({
      where: {
        members: { some: { userId: req.user.userId } },
        NOT: { ownerId: req.user.userId }
      },
      select: { id: true, name: true, dsn: true, createdAt: true }
    });
    res.json({ ownedProjects, invitedProjects });
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
      include: { user: { select: { id: true, email: true, avatar: true } } },
      orderBy: { role: 'asc' }
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil member project' });
  }
});

// Invite member ke project (dengan email)
router.post('/:id/members/invite', auth, async (req: any, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  
  if (!email || !role) {
    return res.status(400).json({ error: 'Email dan role wajib diisi' });
  }
  
  try {
    // Cek apakah requester adalah owner/admin
    const me = await prisma.projectMember.findFirst({ 
      where: { projectId: id, userId: req.user.userId } 
    });
    
    if (!me || (me.role !== 'admin' && me.role !== 'owner')) {
      return res.status(403).json({ error: 'Hanya owner/admin yang bisa invite' });
    }
    
    // Ambil detail project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: { select: { email: true, name: true } } }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    
    // Import fungsi token dan template email
    const { generateToken, getInviteTokenExpiry } = require('../utils/token');
    const { getProjectInviteEmailTemplate } = require('../templates/email');
    
    // Buat token invite
    const inviteToken = generateToken();
    const inviteTokenExpiry = getInviteTokenExpiry(); // berlaku 24 jam
    
    // Cari user by email
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Buat user baru (belum aktif)
      user = await prisma.user.create({ 
        data: { 
          email, 
          passwordHash: '',
          emailVerified: false,
          verificationToken: inviteToken,
          verificationTokenExpiry: inviteTokenExpiry
        } 
      });
    } else {
      // Cek apakah sudah jadi member
      const exist = await prisma.projectMember.findFirst({ 
        where: { projectId: id, userId: user.id } 
      });
      
      if (exist) {
        return res.status(409).json({ error: 'User sudah jadi member' });
      }
    }
    
    // Buat link invite
    const inviteLink = `${process.env.FRONTEND_URL}/invite?token=${inviteToken}&projectId=${id}&email=${encodeURIComponent(email)}`;
    
    // Siapkan email invite
    const inviterName = req.user.name || req.user.email;
    const projectName = project.name;
    const userName = email.split('@')[0];
    
    // Gunakan template email
    const emailHtml = getProjectInviteEmailTemplate(
      userName,
      inviterName,
      projectName,
      role,
      inviteLink
    );
    
    // Kirim email invite
    let emailError = null;
    
    try {
      // Hanya kirim email jika Resend API Key ada
      if (process.env.RESEND_API_KEY) {
        const { data, error } = await resend.emails.send({
          from: 'LogRaven <onboarding@resend.dev>',
          to: process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev',
          subject: `Undangan ke Project ${projectName}`,
          html: emailHtml
        });
        
        if (error) {
          console.error('Error sending invite email:', error);
          emailError = error;
        }
      } else {
        console.log('Skipping email sending in development mode without RESEND_API_KEY');
        console.log('Would have sent email to:', email);
        console.log('Invite link:', inviteLink);
      }
    } catch (emailErr) {
      console.error('Exception during email sending:', emailErr);
      emailError = emailErr;
    }
    
    // Hanya return error jika dalam production mode
    if (emailError && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Gagal mengirim email undangan' });
    }
    
    // Simpan data invite ke database (untuk diproses nanti saat user klik link)
    const projectInvite = await prisma.projectInvite.create({
      data: {
        projectId: id,
        email: email,
        role: role,
        token: inviteToken,
        expiresAt: inviteTokenExpiry,
        invitedBy: req.user.userId
      }
    });
    
    res.status(201).json({ 
      success: true, 
      message: `Undangan berhasil dikirim ke ${email}`,
      invite: {
        id: projectInvite.id,
        email: projectInvite.email,
        role: projectInvite.role,
        expiresAt: projectInvite.expiresAt
      }
    });
  } catch (err) {
    console.error('Error inviting member:', err);
    res.status(500).json({ error: 'Gagal mengundang member' });
  }
});

// Terima undangan project
router.post('/accept-invite', async (req, res) => {
  const { token, projectId, email } = req.body;
  
  if (!token || !projectId || !email) {
    return res.status(400).json({ error: 'Token, project ID, dan email wajib diisi' });
  }
  
  try {
    // Import fungsi token
    const { isTokenValid } = require('../utils/token');
    
    // Cari invite yang sesuai
    const invite = await prisma.projectInvite.findFirst({
      where: {
        token,
        projectId,
        email,
        status: 'PENDING'
      }
    });
    
    if (!invite) {
      return res.status(404).json({ error: 'Undangan tidak ditemukan atau sudah tidak berlaku' });
    }
    
    // Cek apakah token masih valid (belum kadaluarsa)
    if (!isTokenValid(invite.expiresAt)) {
      await prisma.projectInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ error: 'Undangan sudah kadaluarsa' });
    }
    
    // Cari user dengan email tersebut
    let user = await prisma.user.findUnique({ where: { email } });
    
    // Jika user belum terdaftar (pengguna mengakses link invite tanpa memiliki akun)
    if (!user) {
      return res.status(404).json({ 
        error: 'User belum terdaftar',
        needRegister: true,
        email,
        inviteToken: token
      });
    }
    
    // Cek apakah user sudah menjadi member project
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });
    
    if (existingMember) {
      // Update status invite
      await prisma.projectInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' }
      });
      
      return res.status(409).json({ 
        error: 'Anda sudah menjadi member project ini',
        alreadyMember: true
      });
    }
    
    // Tambahkan user sebagai member project
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: invite.role
      }
    });
    
    // Update status invite
    await prisma.projectInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' }
    });
    
    // Ambil detail project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true }
    });
    
    res.status(200).json({
      success: true,
      message: `Anda telah berhasil bergabung dengan project ${project?.name}`,
      projectId,
      projectName: project?.name,
      role: invite.role
    });
  } catch (err) {
    console.error('Error accepting invite:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat menerima undangan' });
  }
});

// List semua undangan yang pending
router.get('/:id/invites', auth, async (req: any, res) => {
  const { id } = req.params;
  
  try {
    // Cek apakah requester adalah owner/admin
    const me = await prisma.projectMember.findFirst({ 
      where: { projectId: id, userId: req.user.userId } 
    });
    
    if (!me || (me.role !== 'admin' && me.role !== 'owner')) {
      return res.status(403).json({ error: 'Hanya owner/admin yang bisa melihat daftar undangan' });
    }
    
    // Ambil semua undangan yang pending
    const invites = await prisma.projectInvite.findMany({
      where: { 
        projectId: id,
        status: 'PENDING'
      },
      include: {
        inviter: {
          select: { email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(invites);
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Gagal mengambil data undangan' });
  }
});

// Batalkan undangan
router.delete('/:id/invites/:inviteId', auth, async (req: any, res) => {
  const { id, inviteId } = req.params;
  
  try {
    // Cek apakah requester adalah owner/admin
    const me = await prisma.projectMember.findFirst({ 
      where: { projectId: id, userId: req.user.userId } 
    });
    
    if (!me || (me.role !== 'admin' && me.role !== 'owner')) {
      return res.status(403).json({ error: 'Hanya owner/admin yang bisa membatalkan undangan' });
    }
    
    // Update status invite menjadi CANCELLED
    await prisma.projectInvite.update({
      where: { id: inviteId },
      data: { status: 'CANCELLED' }
    });
    
    res.json({ success: true, message: 'Undangan berhasil dibatalkan' });
  } catch (err) {
    console.error('Error cancelling invite:', err);
    res.status(500).json({ error: 'Gagal membatalkan undangan' });
  }
});

// Kirim ulang undangan
router.post('/:id/invites/:inviteId/resend', auth, async (req: any, res) => {
  const { id, inviteId } = req.params;
  
  try {
    // Cek apakah requester adalah owner/admin
    const me = await prisma.projectMember.findFirst({ 
      where: { projectId: id, userId: req.user.userId } 
    });
    
    if (!me || (me.role !== 'admin' && me.role !== 'owner')) {
      return res.status(403).json({ error: 'Hanya owner/admin yang bisa mengirim ulang undangan' });
    }
    
    // Cari data undangan
    const invite = await prisma.projectInvite.findUnique({
      where: { id: inviteId },
      include: { project: true }
    });
    
    if (!invite || invite.status !== 'PENDING') {
      return res.status(404).json({ error: 'Undangan tidak ditemukan atau sudah tidak berlaku' });
    }
    
    // Import fungsi token
    const { getVerificationTokenExpiry } = require('../utils/token');
    // Import template email
    const { getProjectInviteEmailTemplate } = require('../templates/email');
    
    // Update expiry time (perpanjang 24 jam dari sekarang)
    const newExpiryTime = getVerificationTokenExpiry();
    await prisma.projectInvite.update({
      where: { id: inviteId },
      data: { expiresAt: newExpiryTime }
    });
    
    // Buat link invite
    const inviteLink = `${process.env.FRONTEND_URL}/invite?token=${invite.token}&projectId=${id}&email=${encodeURIComponent(invite.email)}`;
    
    // Ambil info inviter (pengirim)
    const inviter = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true, email: true }
    });
    
    // Siapkan email invite
    const inviterName = inviter?.name || inviter?.email || 'Admin';
    const projectName = invite.project.name;
    const userName = invite.email.split('@')[0];
    
    // Gunakan template email
    const emailHtml = getProjectInviteEmailTemplate(
      userName,
      inviterName,
      projectName,
      invite.role,
      inviteLink
    );
    
    // Kirim email invite
    let emailError = null;
    
    try {
      // Hanya kirim email jika Resend API Key ada
      if (process.env.RESEND_API_KEY) {
        const { data, error } = await resend.emails.send({
          from: 'LogRaven <onboarding@resend.dev>',
          to: process.env.NODE_ENV === 'production' ? invite.email : 'delivered@resend.dev',
          subject: `Pengingat: Undangan ke Project ${projectName}`,
          html: emailHtml
        });
        
        if (error) {
          console.error('Error sending invite email:', error);
          emailError = error;
        }
      } else {
        console.log('Skipping email sending in development mode without RESEND_API_KEY');
        console.log('Would have sent email to:', invite.email);
        console.log('Invite link:', inviteLink);
      }
    } catch (emailErr) {
      console.error('Exception during email sending:', emailErr);
      emailError = emailErr;
    }
    
    // Hanya return error jika dalam production mode
    if (emailError && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Gagal mengirim email undangan' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Undangan berhasil dikirim ulang ke ${invite.email}`,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: newExpiryTime
      }
    });
  } catch (err) {
    console.error('Error resending invite:', err);
    res.status(500).json({ error: 'Gagal mengirim ulang undangan' });
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

// Hapus project
router.delete('/:id', auth, async (req: any, res) => {
  const { id } = req.params;
  try {
    // Pastikan user adalah owner project
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project tidak ditemukan' });
    if (project.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Anda tidak berhak menghapus project ini.' });
    }
    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus project.' });
  }
});

export default router; 