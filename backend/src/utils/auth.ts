import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Interface untuk menyimpan user data pada request
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Middleware autentikasi
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
    };
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token tidak valid atau kadaluarsa.' });
  }
}; 