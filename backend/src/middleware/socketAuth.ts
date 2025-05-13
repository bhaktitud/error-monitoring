import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ExtendedError } from 'socket.io/dist/namespace';
import { getClientIp } from '../utils/socketUtils';

/**
 * Middleware untuk otentikasi koneksi Socket.IO
 */
export const socketAuthMiddleware = (
  socket: Socket, 
  next: (err?: ExtendedError) => void
) => {
  try {
    // Coba ambil token dari beberapa kemungkinan lokasi
    let token = socket.handshake.auth.token;
    
    if (!token && socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }
    }
    
    if (!token && socket.handshake.query.token) {
      token = socket.handshake.query.token as string;
    }
    
    console.log(`Socket connection attempt: ${socket.id}`);
    console.log('Token exists:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('No token provided for Socket.IO connection');
      return next(new Error('Authentication error: No token provided'));
    }

    // Untuk debugging - cek format token
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('Invalid JWT format');
      return next(new Error('Authentication error: Invalid token format'));
    }

    // Decode payload untuk debug
    try {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('Token payload:', payload);
    } catch (e) {
      console.log('Error decoding token payload:', e);
    }

    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('Decoded token:', decoded);
    
    // Support semua format yang mungkin
    const userId = decoded.userId || decoded.id || decoded.sub;
    
    if (!userId) {
      console.log('Token valid but no user ID found');
      return next(new Error('Authentication error: No user ID in token'));
    }
    
    // Simpan informasi userId di socket untuk penggunaan di handler
    socket.data.userId = userId;
    socket.data.connectionTime = new Date();
    socket.data.clientIp = getClientIp(socket);
    console.log(`Socket ${socket.id} authenticated for user: ${userId} from IP: ${socket.data.clientIp}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error(`Authentication error: ${(error as Error).message}`));
  }
}; 