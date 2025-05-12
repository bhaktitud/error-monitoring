import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import projectRoutes from './routes/project';
import eventRoutes from './routes/event';
import groupRoutes from './routes/group';
import webhookRoutes from './routes/webhook';
import statsRoutes from './routes/stats';
import notificationRoutes from './routes/notification';
import planRoutes from './routes/plan';
import mediaRoutes from './routes/media';
import { createNotificationRoutes } from './routes/notificationRoutes';
import { authenticateToken } from './middleware/auth';
import jwt from 'jsonwebtoken';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Import routes (akan dibuat nanti)
// import authRoutes from './routes/auth';
// import projectRoutes from './routes/project';
// import eventRoutes from './routes/event';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
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
});

// Rate limiters
const socketConnectLimiter = new RateLimiterMemory({
  points: 5, // 5 koneksi
  duration: 60, // dalam 60 detik
  blockDuration: 300, // blokir selama 5 menit jika melebihi batas
});

const ipConnectionsMap = new Map<string, number>();

// Simpan objek io di app untuk akses dari routes
app.set('io', io);

// Map untuk melacak koneksi user
const userConnectionsMap = new Map<string, Set<string>>();

// Map untuk mengelola throttle per IP 
const lastConnectionAttemptMap = new Map<string, number>();

// Fungsi untuk mendapatkan client IP dari socket
function getClientIp(socket: any): string {
  let ip = socket.handshake.headers['x-forwarded-for'] || 
           socket.handshake.headers['x-real-ip'] || 
           socket.handshake.address;
  
  // Jika ada multiple IPs (melalui proxy), ambil yang pertama
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  
  return ip.toString();
}

// Fungsi untuk membersihkan koneksi yang tidak digunakan
function cleanupUserConnections() {
  for (const [userId, socketIds] of userConnectionsMap.entries()) {
    // Cek socket IDs yang valid
    const validSocketIds = new Set<string>();
    
    for (const socketId of socketIds) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket && socket.connected) {
        validSocketIds.add(socketId);
      }
    }
    
    if (validSocketIds.size === 0) {
      // Hapus user dari map jika tidak ada socket yang valid
      userConnectionsMap.delete(userId);
      console.log(`Cleaned up user ${userId} with no valid connections`);
    } else if (validSocketIds.size !== socketIds.size) {
      // Update map jika ada socket yang tidak valid
      userConnectionsMap.set(userId, validSocketIds);
      console.log(`Updated connections for user ${userId}: ${validSocketIds.size} valid connections`);
    }
  }
  
  // Bersihkan IP throttling data yang sudah lama
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  
  for (const [ip, timestamp] of lastConnectionAttemptMap.entries()) {
    if (now - timestamp > FIVE_MINUTES) {
      lastConnectionAttemptMap.delete(ip);
    }
  }
  
  // Reset IP connections counter jika sudah lama
  for (const [ip, count] of ipConnectionsMap.entries()) {
    const connectionTimestamp = lastConnectionAttemptMap.get(ip);
    if (connectionTimestamp && now - connectionTimestamp > FIVE_MINUTES) {
      ipConnectionsMap.delete(ip);
    }
  }
}

// Jalankan pembersihan setiap 10 menit
setInterval(cleanupUserConnections, 10 * 60 * 1000);

// Middleware
app.use(cors({
  origin: '*', // Izinkan semua origin untuk debugging
  credentials: true
}));
app.use(express.json());

// Socket.IO middleware untuk rate limiting dan IP throttling
io.use((socket, next) => {
  const clientIp = getClientIp(socket);
  
  // Periksa koneksi sebelumnya dari IP ini
  const now = Date.now();
  const lastConnectTime = lastConnectionAttemptMap.get(clientIp) || 0;
  const timeSinceLastConnect = now - lastConnectTime;
  
  // Terlalu cepat mencoba lagi? (kurang dari 2 detik)
  if (timeSinceLastConnect < 2000) {
    console.log(`Throttling connection from IP ${clientIp} - too rapid reconnection attempts`);
    return next(new Error('Rate limited: Too many connection attempts in short period'));
  }
  
  // Catat jumlah koneksi dari IP ini
  const currentConnections = (ipConnectionsMap.get(clientIp) || 0) + 1;
  ipConnectionsMap.set(clientIp, currentConnections);
  
  // Catat waktu percobaan koneksi
  lastConnectionAttemptMap.set(clientIp, now);
  
  // Terlalu banyak koneksi dari IP yang sama? (lebih dari 20)
  if (currentConnections > 20) {
    console.log(`Blocking connection from IP ${clientIp} - too many connections (${currentConnections})`);
    return next(new Error('Rate limited: Too many connections from same IP'));
  }
  
  // Rate limit per IP menggunakan rate-limiter-flexible
  socketConnectLimiter.consume(clientIp)
    .then(() => {
      // Lanjut ke middleware berikutnya jika rate limit ok
      next();
    })
    .catch(() => {
      console.log(`Rate limit exceeded for IP ${clientIp}`);
      next(new Error('Rate limited: Too many connection attempts'));
    });
});

// Socket.IO middleware untuk autentikasi
io.use((socket, next) => {
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
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const clientIp = socket.data.clientIp;
  console.log(`User connected to socket: ${userId} (Socket ID: ${socket.id}, IP: ${clientIp})`);
  
  // Batasi maksimum koneksi per user (opsional)
  const MAX_CONNECTIONS_PER_USER = 5;
  
  // Tambahkan ke userConnectionsMap
  if (!userConnectionsMap.has(userId)) {
    userConnectionsMap.set(userId, new Set([socket.id]));
  } else {
    const userSockets = userConnectionsMap.get(userId)!;
    
    // Batasi jumlah koneksi per user
    if (userSockets.size >= MAX_CONNECTIONS_PER_USER) {
      const oldestSocketId = Array.from(userSockets)[0]; // ambil koneksi tertua
      const oldestSocket = io.sockets.sockets.get(oldestSocketId);
      
      if (oldestSocket) {
        console.log(`User ${userId} exceeded max connections (${MAX_CONNECTIONS_PER_USER}). Disconnecting oldest socket: ${oldestSocketId}`);
        oldestSocket.disconnect(true);
        userSockets.delete(oldestSocketId);
      }
    }
    
    userSockets.add(socket.id);
  }
  
  // Log semua room yang tersedia
  console.log('Current rooms on server:', io.sockets.adapter.rooms);
  
  // Join room khusus user
  const userRoom = `user:${userId}`;
  socket.join(userRoom);
  console.log(`User ${userId} joined room: ${userRoom}`);
  
  // Kirim test notification hanya jika flag testing mode aktif
  // dan dibatasi hanya sekali
  if (process.env.ENABLE_TEST_NOTIFICATION === 'true' && !socket.data.testNotificationSent) {
    console.log(`Sending one-time test notification to user ${userId}`);
    
    // Tandai bahwa test notification sudah dikirim untuk socket ini
    socket.data.testNotificationSent = true;
    
    // Kirim test notification sekali
    setTimeout(() => {
      const testNotification = {
        id: 'test-' + Date.now(),
        type: 'TEST_SINGLE',
        title: 'Test Notification (One-time)',
        message: 'Ini adalah notifikasi test satu kali untuk memverifikasi koneksi socket',
        read: false,
        createdAt: new Date().toISOString()
      };
      
      try {
        // Kirim hanya ke socket ini, bukan ke semua client di room
        socket.emit('notification', testNotification);
        console.log('One-time test notification sent to socket:', socket.id);
      } catch (err) {
        console.error('Error sending test notification:', err);
      }
    }, 3000);
  }
  
  // Handle heartbeat untuk cek koneksi tetap hidup
  socket.on('heartbeat', () => {
    socket.emit('heartbeat_response');
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`User ${userId} disconnected (Socket ID: ${socket.id}). Reason: ${reason}`);
    socket.leave(userRoom);
    
    // Update user connections map
    const userSockets = userConnectionsMap.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        userConnectionsMap.delete(userId);
        console.log(`All connections for user ${userId} have been closed`);
      } else {
        console.log(`User ${userId} still has ${userSockets.size} active connections`);
      }
    }
    
    // Kurangi hitungan koneksi dari IP
    const clientIp = socket.data.clientIp;
    if (clientIp) {
      const currentConnections = ipConnectionsMap.get(clientIp) || 0;
      if (currentConnections > 0) {
        ipConnectionsMap.set(clientIp, currentConnections - 1);
      }
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', webhookRoutes);
app.use('/api', statsRoutes);
app.use('/api/notifications', createNotificationRoutes(io));
app.use('/api/plans', planRoutes);
app.use('/api/media', mediaRoutes);

app.get('/', (req, res) => {
  res.send('Sentry Clone API running!');
});

// Endpoint untuk memantau koneksi aktif - hanya untuk debugging
app.get('/api/debug/socket-connections', (req, res) => {
  const connections: Record<string, string[]> = {};
  for (const [userId, socketIds] of userConnectionsMap.entries()) {
    connections[userId] = Array.from(socketIds);
  }
  
  // Tambahkan informasi IP
  const ipStats: Record<string, number> = {};
  for (const [ip, count] of ipConnectionsMap.entries()) {
    ipStats[ip] = count;
  }
  
  res.json({
    totalUsers: userConnectionsMap.size,
    totalConnections: Array.from(userConnectionsMap.values()).reduce((acc, sockets) => acc + sockets.size, 0),
    connections,
    ipConnections: ipStats
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
}); 