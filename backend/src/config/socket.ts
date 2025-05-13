import { Server, ServerOptions } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuthMiddleware } from '../middleware/socketAuth';
import { socketRateLimitMiddleware } from '../middleware/socketRateLimit';
import { setupSocketHandlers } from '../services/socketService';

/**
 * Konfigurasi dan inisialisasi Socket.IO
 * @param httpServer HTTP server instance
 * @returns Socket.IO server instance
 */
export function setupSocketIO(httpServer: HttpServer): Server {
  // Opsi konfigurasi Socket.IO
  const socketOptions: Partial<ServerOptions> = {
    cors: {
      origin: '*', // Izinkan semua origin untuk debugging
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    allowEIO3: true, // Kompatibilitas dengan versi lama engine.io
    pingTimeout: 60000, // Meningkatkan timeout ping ke 60 detik
    pingInterval: 25000, // Interval ping 25 detik
    connectTimeout: 45000, // Timeout koneksi 45 detik
    maxHttpBufferSize: 1e8, // 100 MB
    transports: ['websocket', 'polling'] // Coba websocket dulu, fallback ke polling
  };

  // Inisialisasi Server Socket.IO
  const io = new Server(httpServer, socketOptions);

  // Terapkan middleware
  // DINONAKTIFKAN SEMENTARA: Rate limit untuk socket.io 
  // io.use(socketRateLimitMiddleware);
  
  io.use(socketAuthMiddleware);

  // Setup event handlers
  setupSocketHandlers(io);

  return io;
} 