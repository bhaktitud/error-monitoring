import { Server, Socket } from 'socket.io';
import { cleanupRateLimitData, decrementIpConnection } from '../middleware/socketRateLimit';

// Map untuk melacak koneksi user
const userConnectionsMap = new Map<string, Set<string>>();

/**
 * Membersihkan koneksi pengguna yang tidak valid
 * @param io Server Socket.IO
 */
export function cleanupUserConnections(io: Server): void {
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
  
  // Bersihkan data rate limiting
  cleanupRateLimitData();
}

/**
 * Set up event handlers untuk Socket.IO
 * @param io Server Socket.IO
 */
export function setupSocketHandlers(io: Server): void {
  // Socket.IO connection handler
  io.on('connection', (socket: Socket) => {
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
        decrementIpConnection(clientIp);
      }
    });
  });
  
  // Jalankan pembersihan setiap 10 menit
  setInterval(() => cleanupUserConnections(io), 10 * 60 * 1000);
}

/**
 * Mendapatkan statistik koneksi pengguna
 * @returns Rekap statistik koneksi
 */
export function getUserConnectionsStats(): {
  totalUsers: number;
  totalConnections: number;
  connections: Record<string, string[]>;
} {
  const connections: Record<string, string[]> = {};
  for (const [userId, socketIds] of userConnectionsMap.entries()) {
    connections[userId] = Array.from(socketIds);
  }
  
  return {
    totalUsers: userConnectionsMap.size,
    totalConnections: Array.from(userConnectionsMap.values()).reduce((acc, sockets) => acc + sockets.size, 0),
    connections
  };
} 