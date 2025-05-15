import crypto from 'crypto';

// Gunakan environment variable untuk encryption key dan iv
// Jika tidak ada, gunakan default (untuk development)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-must-be-32-bytes-long';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'unique-iv-16byte';

// Pastikan ukuran key adalah 32 bytes (256 bit) untuk aes-256-cbc
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
// Pastikan IV adalah 16 bytes
const iv = Buffer.from(ENCRYPTION_IV.padEnd(16).slice(0, 16));

/**
 * Mengenkripsi string menggunakan AES-256-CBC
 * @param text String yang akan dienkripsi
 * @returns String terenkripsi (format: hex)
 */
export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * Mendekripsi string yang telah dienkripsi dengan AES-256-CBC
 * @param encryptedText String terenkripsi (format: hex)
 * @returns String asli (terdekripsi)
 */
export function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
} 