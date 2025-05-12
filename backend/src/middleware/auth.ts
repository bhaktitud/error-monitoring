import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Cari user ID dari berbagai kemungkinan field dalam token
    const userId = decoded.id || decoded.userId || decoded.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID tidak ditemukan dalam token' });
    }
    
    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    // Pastikan user ID selalu tersedia dalam kedua format
    (req as any).user = {
      ...user,
      id: userId,
      userId: userId
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
    console.error('Error in authentication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 