import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getClientIp } from '../utils/socketUtils';

// Map untuk melacak koneksi per IP
const ipConnectionsMap = new Map<string, number>();

// Map untuk mengelola throttle per IP 
const lastConnectionAttemptMap = new Map<string, number>();

// Rate limiter untuk koneksi socket
const socketConnectLimiter = new RateLimiterMemory({
  points: 5, // 5 koneksi
  duration: 60, // dalam 60 detik
  blockDuration: 300, // blokir selama 5 menit jika melebihi batas
});

/**
 * Membersihkan data rate limiting yang sudah tidak digunakan
 */
export function cleanupRateLimitData(): void {
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

/**
 * Middleware untuk rate limiting pada koneksi Socket.IO
 */
export const socketRateLimitMiddleware = (
  socket: Socket, 
  next: (err?: ExtendedError) => void
) => {
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
};

/**
 * Mendapatkan maps untuk koneksi IP
 */
export function getIpConnectionsStats(): Record<string, number> {
  const ipStats: Record<string, number> = {};
  for (const [ip, count] of ipConnectionsMap.entries()) {
    ipStats[ip] = count;
  }
  return ipStats;
}

/**
 * Mengurangi hitungan koneksi untuk IP tertentu
 * @param ip Alamat IP
 */
export function decrementIpConnection(ip: string): void {
  const currentConnections = ipConnectionsMap.get(ip) || 0;
  if (currentConnections > 0) {
    ipConnectionsMap.set(ip, currentConnections - 1);
  }
} 