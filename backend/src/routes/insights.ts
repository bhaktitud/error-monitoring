import express from 'express';
import prisma from '../models/prisma';
import { authMiddleware } from '../utils/auth';
import { ErrorInsightService } from '../services/errorInsightService';
import { 
  getEventRootCause, 
  getGroupRootCause,
  getSimilarErrors,
  getCoOccurringErrors
} from '../controllers/insightsController';

const router = express.Router();
const errorInsightService = new ErrorInsightService();

/**
 * Verifikasi apakah user memiliki akses ke project
 */
async function verifyProjectAccess(req: any, res: express.Response, next: express.NextFunction) {
  try {
    const { id: projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Cek apakah user adalah owner atau member
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next(); // Owner, lanjutkan
    }

    // Cek membership
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'No access to this project' });
    }

    next();
  } catch (error) {
    console.error('Error verifying project access:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Get error correlations - 90% user yang kena error A, sebelumnya kena error B
 * GET /api/insights/projects/:id/error-correlations
 */
router.get('/projects/:id/error-correlations', authMiddleware, verifyProjectAccess, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { errorGroupId, timeWindow = '7d' } = req.query;

    if (!errorGroupId) {
      return res.status(400).json({ error: 'errorGroupId parameter is required' });
    }

    const validTimeWindows = ['24h', '7d', '30d'];
    if (timeWindow && !validTimeWindows.includes(timeWindow as string)) {
      return res.status(400).json({ 
        error: `Invalid timeWindow. Valid values are: ${validTimeWindows.join(', ')}` 
      });
    }

    const correlations = await errorInsightService.analyzeErrorCorrelations(
      projectId,
      errorGroupId as string,
      timeWindow as '24h' | '7d' | '30d'
    );

    res.json({
      errorGroupId,
      timeWindow,
      correlations
    });
  } catch (error) {
    console.error('Error getting error correlations:', error);
    res.status(500).json({ error: 'Failed to analyze error correlations' });
  }
});

/**
 * Get user impact metrics - error ini terjadi ke 70% user dalam 1 jam terakhir
 * GET /api/insights/projects/:id/user-impact
 */
router.get('/projects/:id/user-impact', authMiddleware, verifyProjectAccess, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { errorGroupId, timeWindow = '1h' } = req.query;

    const validTimeWindows = ['1h', '24h', '7d'];
    if (timeWindow && !validTimeWindows.includes(timeWindow as string)) {
      return res.status(400).json({ 
        error: `Invalid timeWindow. Valid values are: ${validTimeWindows.join(', ')}` 
      });
    }

    // Jika errorGroupId diberikan, dapatkan impact untuk group tertentu
    // Jika tidak, dapatkan impact untuk semua group
    const impactMetrics = await errorInsightService.calculateUserImpact(
      projectId,
      errorGroupId as string || null,
      timeWindow as '1h' | '24h' | '7d'
    );

    res.json({
      projectId,
      timeWindow,
      metrics: impactMetrics
    });
  } catch (error) {
    console.error('Error getting user impact metrics:', error);
    res.status(500).json({ error: 'Failed to calculate user impact metrics' });
  }
});

/**
 * Set user count for impact calculations
 * POST /api/insights/projects/:id/active-users
 */
router.post('/projects/:id/active-users', authMiddleware, verifyProjectAccess, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { userCount, timeWindow = '1h' } = req.body;

    if (typeof userCount !== 'number' || userCount < 0) {
      return res.status(400).json({ error: 'Invalid userCount value' });
    }

    const validTimeWindows = ['1h', '24h', '7d'];
    if (!validTimeWindows.includes(timeWindow)) {
      return res.status(400).json({ 
        error: `Invalid timeWindow. Valid values are: ${validTimeWindows.join(', ')}` 
      });
    }

    await errorInsightService.updateActiveUserCount(
      projectId,
      timeWindow as '1h' | '24h' | '7d',
      userCount
    );

    res.json({
      success: true,
      projectId,
      timeWindow,
      userCount
    });
  } catch (error) {
    console.error('Error updating active user count:', error);
    res.status(500).json({ error: 'Failed to update active user count' });
  }
});

/**
 * @route   GET /api/insights/events/:eventId/root-cause
 * @desc    Mendapatkan analisis akar masalah untuk event tertentu
 * @access  Private
 */
router.get('/events/:eventId/root-cause', authMiddleware, async (req: any, res, next) => {
  try {
    const { eventId } = req.params;
    
    // Mengambil projectId dari event untuk verifikasi akses
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { projectId: true }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    // Verifikasi akses ke project
    const projectId = event.projectId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek apakah user adalah owner atau member
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next(); // Owner, lanjutkan
    }

    // Cek membership
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'No access to this project' });
    }
    
    next();
  } catch (error) {
    console.error('Error in route middleware:', error);
    res.status(500).json({ error: 'Server error' });
  }
}, getEventRootCause);

/**
 * @route   GET /api/insights/groups/:groupId/root-cause
 * @desc    Mendapatkan analisis akar masalah untuk grup error
 * @access  Private
 */
router.get('/groups/:groupId/root-cause', authMiddleware, async (req: any, res, next) => {
  // Authentication middleware hampir sama dengan endpoint event
  try {
    const { groupId } = req.params;
    
    // Verify project access melalui grup
    const group = await prisma.errorGroup.findUnique({
      where: { id: groupId },
      select: { projectId: true }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Grup error tidak ditemukan' });
    }
    
    // Check if user has access to this project
    const projectId = group.projectId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek apakah user adalah owner atau member
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next(); // Owner, lanjutkan
    }

    // Cek membership
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'No access to this project' });
    }
    
    next();
  } catch (error) {
    console.error('Error in route middleware:', error);
    res.status(500).json({ error: 'Server error' });
  }
}, getGroupRootCause);

/**
 * @route   GET /api/insights/projects/:projectId/error-correlations
 * @desc    Mendapatkan korelasi antara error (placeholder untuk tahap selanjutnya)
 * @access  Private
 */
router.get('/projects/:projectId/error-correlations', authMiddleware, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { errorGroupId, timeWindow } = req.query;
    
    // Verify project access
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek akses ke project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.ownerId !== req.user.id) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: req.user.id,
        },
      });
      
      if (!membership) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
    }
    
    // Placeholder response untuk tahap 1
    // Ini akan diimplementasikan di tahap berikutnya
    res.json({
      projectId,
      errorGroupId: errorGroupId || null,
      timeWindow: timeWindow || '7d',
      correlations: [],
      message: 'Fitur ini akan diimplementasikan di tahap berikutnya'
    });
  } catch (error) {
    console.error('Error in getErrorCorrelations:', error);
    res.status(500).json({ error: 'Gagal menganalisis korelasi error' });
  }
});

/**
 * @route   GET /api/insights/projects/:projectId/user-impact
 * @desc    Mendapatkan metrik dampak error pada pengguna (placeholder untuk tahap selanjutnya)
 * @access  Private
 */
router.get('/projects/:projectId/user-impact', authMiddleware, async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const { errorGroupId, timeWindow } = req.query;
    
    // Verify project access
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek akses ke project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.ownerId !== req.user.id) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: req.user.id,
        },
      });
      
      if (!membership) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
    }
    
    // Placeholder response untuk tahap 1
    // Ini akan diimplementasikan di tahap berikutnya
    res.json({
      projectId,
      timeWindow: timeWindow || '24h',
      metrics: [],
      message: 'Fitur ini akan diimplementasikan di tahap berikutnya'
    });
  } catch (error) {
    console.error('Error in getUserImpact:', error);
    res.status(500).json({ error: 'Gagal menganalisis dampak pengguna' });
  }
});

/**
 * @route   GET /api/insights/events/:eventId/similar
 * @desc    Mendapatkan error yang mirip dengan event tertentu
 * @access  Private
 */
router.get('/events/:eventId/similar', authMiddleware, async (req: any, res, next) => {
  try {
    const { eventId } = req.params;
    
    // Mengambil projectId dari event untuk verifikasi akses
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { projectId: true }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    // Verifikasi akses ke project
    const projectId = event.projectId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek apakah user adalah owner atau member
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next(); // Owner, lanjutkan
    }

    // Cek membership
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'No access to this project' });
    }
    
    next();
  } catch (error) {
    console.error('Error in route middleware:', error);
    res.status(500).json({ error: 'Server error' });
  }
}, getSimilarErrors);

/**
 * @route   GET /api/insights/groups/:groupId/co-occurring
 * @desc    Mendapatkan error yang sering terjadi bersamaan dengan grup error tertentu
 * @access  Private
 */
router.get('/groups/:groupId/co-occurring', authMiddleware, async (req: any, res, next) => {
  try {
    const { groupId } = req.params;
    
    // Verify project access melalui grup
    const group = await prisma.errorGroup.findUnique({
      where: { id: groupId },
      select: { projectId: true }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Grup error tidak ditemukan' });
    }
    
    // Check if user has access to this project
    const projectId = group.projectId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek apakah user adalah owner atau member
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId === userId) {
      return next(); // Owner, lanjutkan
    }

    // Cek membership
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'No access to this project' });
    }
    
    next();
  } catch (error) {
    console.error('Error in route middleware:', error);
    res.status(500).json({ error: 'Server error' });
  }
}, getCoOccurringErrors);

export default router; 