import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Deklarasi tipe untuk Request yang sudah berisi properti user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

// Middleware autentikasi
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  }
  
  try {
    console.log(token, 'token middleware');
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
    };
    
    // Menyesuaikan format user untuk memenuhi deklarasi global
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token tidak valid atau kadaluarsa.' });
  }
}; 