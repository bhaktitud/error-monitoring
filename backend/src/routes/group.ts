import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ErrorGroupingService } from '../services/errorGroupingService';
import prisma from '../models/prisma';
import { NotificationService } from '../services/notificationService';

// Interface untuk user dari request setelah autentikasi
interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

// Memperluas tipe Request dari Express
interface ExtendedRequest extends Request {
  user?: AuthenticatedUser;
  errorGroup?: any;
  member?: any;
}

const router = express.Router();
const errorGroupingService = new ErrorGroupingService();

// Middleware untuk memeriksa akses project
const checkProjectAccess = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi' });
    }
    
    const userId = req.user.id;
    const { projectId } = req.params;
    
    // Cek apakah user adalah owner project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });
    
    if (project) {
      return next();
    }
    
    // Cek apakah user adalah member project
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    });
    
    if (!member) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke project ini' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking project access:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

// Middleware untuk memeriksa akses error group
const checkGroupAccess = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi' });
    }
    
    const userId = req.user.id;
    const { groupId } = req.params;
    
    // Cari error group beserta informasi project
    const errorGroup = await prisma.errorGroup.findUnique({
      where: { id: groupId },
      include: { project: true }
    });
    
    if (!errorGroup) {
      return res.status(404).json({ error: 'Error group tidak ditemukan' });
    }
    
    // Cek apakah user adalah owner project
    if (errorGroup.project.ownerId === userId) {
      req.errorGroup = errorGroup;
      return next();
    }
    
    // Cek apakah user adalah member project
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: errorGroup.projectId,
        userId
      }
    });
    
    if (!member) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke error group ini' });
    }
    
    req.errorGroup = errorGroup;
    req.member = member;
    next();
  } catch (error) {
    console.error('Error checking group access:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

// Mendapatkan daftar error group untuk project tertentu
router.get('/project/:projectId', authenticateToken, checkProjectAccess, async (req: ExtendedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { 
      page = '1', 
      limit = '20', 
      status = 'all', 
      search = '',
      sortBy = 'lastSeen',
      sortOrder = 'desc'
    } = req.query;
    
    const result = await errorGroupingService.getErrorGroups(projectId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string) === 'asc' ? 'asc' : 'desc'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching error groups:', error);
    res.status(500).json({ error: 'Gagal mengambil data error groups' });
  }
});

// Mendapatkan detail error group beserta event terkait
router.get('/:groupId', authenticateToken, checkGroupAccess, async (req: ExtendedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { eventPage = '1', eventLimit = '10' } = req.query;
    
    const result = await errorGroupingService.getErrorGroupDetail(groupId, {
      eventPage: parseInt(eventPage as string),
      eventLimit: parseInt(eventLimit as string)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching error group detail:', error);
    res.status(500).json({ error: 'Gagal mengambil detail error group' });
  }
});

// Mengubah status error group (resolve, ignore, reopen)
router.put('/:groupId/status', authenticateToken, checkGroupAccess, async (req: ExtendedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { status } = req.body;
    
    if (!status || !['open', 'resolved', 'ignored'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }
    
    const updated = await errorGroupingService.updateErrorGroupStatus(groupId, status);
    
    // Kirim notifikasi jika status berubah ke resolved
    if (status === 'resolved' && req.errorGroup && req.user) {
      try {
        const io = req.app.get('io');
        const projectOwner = await prisma.user.findUnique({
          where: { id: req.errorGroup.project.ownerId }
        });
        
        if (io && projectOwner) {
          const notificationService = new NotificationService(io);
          await notificationService.createNotification({
            userId: projectOwner.id,
            type: 'error_resolved',
            title: `Error resolved di ${req.errorGroup.project.name}`,
            message: `${req.errorGroup.errorType}: ${req.errorGroup.message}`,
            data: {
              projectId: req.errorGroup.projectId,
              errorGroupId: groupId,
              resolvedBy: req.user.id
            }
          });
        }
      } catch (notifError) {
        console.error('Error sending resolved notification:', notifError);
      }
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating error group status:', error);
    res.status(500).json({ error: 'Gagal mengubah status error group' });
  }
});

// Meng-assign error group ke member project
router.put('/:groupId/assign', authenticateToken, checkGroupAccess, async (req: ExtendedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID tidak boleh kosong' });
    }
    
    if (!req.errorGroup) {
      return res.status(404).json({ error: 'Error group tidak ditemukan' });
    }
    
    // Cek apakah member adalah bagian dari project
    const member = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId: req.errorGroup.projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!member) {
      return res.status(404).json({ error: 'Member tidak ditemukan di project ini' });
    }
    
    const updated = await errorGroupingService.assignErrorGroup(groupId, memberId);
    
    // Kirim notifikasi ke member yang di-assign
    try {
      const io = req.app.get('io');
      
      if (io && req.user && req.errorGroup) {
        const notificationService = new NotificationService(io);
        await notificationService.createNotification({
          userId: member.user.id,
          type: 'error_assigned',
          title: `Error assigned di ${req.errorGroup.project.name}`,
          message: `Anda di-assign ke error: ${req.errorGroup.errorType}`,
          data: {
            projectId: req.errorGroup.projectId,
            errorGroupId: groupId,
            assignedBy: req.user.id
          }
        });
      }
    } catch (notifError) {
      console.error('Error sending assignment notification:', notifError);
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error assigning error group:', error);
    res.status(500).json({ error: 'Gagal meng-assign error group' });
  }
});

// Menambahkan komentar pada error group
router.post('/:groupId/comments', authenticateToken, checkGroupAccess, async (req: ExtendedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Konten komentar tidak boleh kosong' });
    }
    
    if (!req.errorGroup || !req.user) {
      return res.status(404).json({ error: 'Error group tidak ditemukan atau user tidak terautentikasi' });
    }
    
    // Cek member ID dari request, jika tidak ada gunakan req.member.id yang sudah diset di middleware
    let memberId = req.body.memberId;
    
    if (!memberId && req.member) {
      memberId = req.member.id;
    } else if (!memberId) {
      // Cari memberId jika belum ada
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId: req.errorGroup.projectId,
          userId: req.user.id
        }
      });
      
      if (!member) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengomentari error group ini' });
      }
      
      memberId = member.id;
    }
    
    const comment = await errorGroupingService.addComment(groupId, memberId, content);
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Gagal menambahkan komentar' });
  }
});

// Mendapatkan statistik error untuk project tertentu
router.get('/stats/:projectId', authenticateToken, checkProjectAccess, async (req: ExtendedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { timeframe = 'day' } = req.query;
    
    if (!['day', 'week', 'month'].includes(timeframe as string)) {
      return res.status(400).json({ error: 'Timeframe tidak valid' });
    }
    
    const stats = await errorGroupingService.getErrorStats(
      projectId, 
      timeframe as 'day' | 'week' | 'month'
    );
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching error stats:', error);
    res.status(500).json({ error: 'Gagal mengambil statistik error' });
  }
});

// Mendapatkan events dalam sebuah error group
router.get('/:groupId/events', authenticateToken, checkGroupAccess, async (req: ExtendedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { groupId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where: { groupId } })
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
  } catch (error) {
    console.error('Error fetching group events:', error);
    res.status(500).json({ error: 'Gagal mengambil events untuk error group' });
  }
});

// Mendapatkan komentar untuk sebuah error group
router.get('/:groupId/comments', authenticateToken, checkGroupAccess, async (req: ExtendedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    
    const comments = await prisma.errorGroupComment.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching group comments:', error);
    res.status(500).json({ error: 'Gagal mengambil komentar untuk error group' });
  }
});

export default router; 