import { Router } from 'express';
import prisma from '../models/prisma';
import { authMiddleware } from '../utils/auth';

const router = Router();

/**
 * Get project statistics
 * GET /stats/projects/:id
 */
router.get('/stats/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const timeframe = req.query.timeframe as string || 'day';
    
    let startDate: Date;
    const now = new Date();
    
    // Menentukan rentang waktu berdasarkan timeframe
    switch(timeframe) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default: // day
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    // Mengambil total events
    const totalEvents = await prisma.event.count({
      where: {
        projectId: id,
        timestamp: {
          gte: startDate
        }
      }
    });
    
    // Mengambil data group
    const groupStats = await prisma.$transaction([
      // Total groups
      prisma.errorGroup.count({
        where: {
          projectId: id,
          firstSeen: {
            gte: startDate
          }
        }
      }),
      // Open groups
      prisma.errorGroup.count({
        where: {
          projectId: id,
          status: 'open',
          firstSeen: {
            gte: startDate
          }
        }
      }),
      // Resolved groups
      prisma.errorGroup.count({
        where: {
          projectId: id,
          status: 'resolved',
          firstSeen: {
            gte: startDate
          }
        }
      }),
      // Ignored groups
      prisma.errorGroup.count({
        where: {
          projectId: id,
          status: 'ignored',
          firstSeen: {
            gte: startDate
          }
        }
      })
    ]);
    
    // Generate hourly data for today
    const eventsByHour = [];
    if (timeframe === 'day') {
      // Untuk timeframe hari, kita ambil data per jam
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const startHour = new Date(now);
        startHour.setHours(i, 0, 0, 0);
        
        const endHour = new Date(now);
        endHour.setHours(i, 59, 59, 999);
        
        const count = await prisma.event.count({
          where: {
            projectId: id,
            timestamp: {
              gte: startHour,
              lte: endHour
            }
          }
        });
        
        eventsByHour.push({
          hour: `${hour}:00`,
          count
        });
      }
    } else {
      // Untuk timeframe minggu/bulan, kita ambil data per hari
      const days = timeframe === 'week' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const dayDate = new Date(now);
        dayDate.setDate(now.getDate() - i);
        
        const startDay = new Date(dayDate);
        startDay.setHours(0, 0, 0, 0);
        
        const endDay = new Date(dayDate);
        endDay.setHours(23, 59, 59, 999);
        
        const count = await prisma.event.count({
          where: {
            projectId: id,
            timestamp: {
              gte: startDay,
              lte: endDay
            }
          }
        });
        
        const dateFormatted = dayDate.toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'short' 
        });
        
        eventsByHour.push({
          hour: dateFormatted,
          count
        });
      }
    }
    
    res.json({
      totalEvents,
      totalGroups: groupStats[0],
      openGroups: groupStats[1],
      resolvedGroups: groupStats[2],
      ignoredGroups: groupStats[3],
      eventsByHour
    });
    
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
});

/**
 * Get error distribution by category (browser, os, device)
 * GET /stats/projects/:id/distribution/:category
 */
router.get('/stats/projects/:id/distribution/:category', authMiddleware, async (req, res) => {
  try {
    const { id, category } = req.params;
    
    if (!['browser', 'os', 'device'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be browser, os, or device' });
    }
    
    // Mendapatkan semua event untuk project dengan kategori yang diminta
    const events = await prisma.event.findMany({
      where: {
        projectId: id
      },
      select: {
        userAgent: true,
        userContext: true,
        tags: true
      }
    });
    
    // Menghitung distribusi
    const distribution = new Map<string, number>();
    let totalCount = 0;
    
    for (const event of events) {
      let value = 'Unknown';
      
      if (category === 'browser' && event.userAgent) {
        // Ambil browser dari user agent
        // Implementasi sederhana, dalam kasus nyata perlu parser yang lebih baik
        if (event.userAgent.includes('Chrome')) {
          value = 'Chrome';
        } else if (event.userAgent.includes('Firefox')) {
          value = 'Firefox';
        } else if (event.userAgent.includes('Safari') && !event.userAgent.includes('Chrome')) {
          value = 'Safari';
        } else if (event.userAgent.includes('Edge')) {
          value = 'Edge';
        } else if (event.userAgent.includes('Opera')) {
          value = 'Opera';
        }
      } else if (category === 'os' && event.userAgent) {
        // Ambil OS dari user agent
        if (event.userAgent.includes('Windows')) {
          value = 'Windows';
        } else if (event.userAgent.includes('Mac OS')) {
          value = 'macOS';
        } else if (event.userAgent.includes('Linux')) {
          value = 'Linux';
        } else if (event.userAgent.includes('Android')) {
          value = 'Android';
        } else if (event.userAgent.includes('iOS')) {
          value = 'iOS';
        }
      } else if (category === 'device' && event.userContext) {
        // Ambil device dari user context jika ada
        const userContext = event.userContext as any;
        if (userContext && userContext.device) {
          value = userContext.device;
        }
      }
      
      distribution.set(value, (distribution.get(value) || 0) + 1);
      totalCount++;
    }
    
    // Format hasil
    const result = Array.from(distribution.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalCount) * 100) || 0
    }));
    
    // Urutkan berdasarkan jumlah (descending)
    result.sort((a, b) => b.count - a.count);
    
    res.json(result);
    
  } catch (error) {
    console.error(`Error fetching ${req.params.category} distribution:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.category} distribution` });
  }
});

export default router; 