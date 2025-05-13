import { Socket } from 'socket.io';

/**
 * Mendapatkan alamat IP client dari koneksi socket
 * @param socket Socket instance
 * @returns IP client
 */
export function getClientIp(socket: Socket): string {
  let ip = socket.handshake.headers['x-forwarded-for'] || 
           socket.handshake.headers['x-real-ip'] || 
           socket.handshake.address;
  
  // Jika ada multiple IPs (melalui proxy), ambil yang pertama
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  
  return ip.toString();
}

/**
 * Mencari tahu apakah socket masih terhubung dan valid
 * @param socket Socket instance
 * @returns true jika socket valid dan terhubung
 */
export function isSocketValid(socket: Socket): boolean {
  return socket.connected;
} 