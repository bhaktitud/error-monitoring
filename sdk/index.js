import fetch from 'node-fetch';

let DSN = '';
let API_URL = '';

export function init({ dsn, apiUrl }) {
  DSN = dsn;
  API_URL = apiUrl || 'http://localhost:3000';
}

export async function captureException(error, options = {}) {
  if (!DSN) throw new Error('SDK belum di-init. Panggil init({dsn, apiUrl}) dulu.');
  const payload = {
    errorType: error.name,
    message: error.message,
    stacktrace: error.stack,
    userAgent: options.userAgent || '',
  };
  try {
    const res = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dsn': DSN,
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    // Gagal kirim error ke server
    return { error: 'Gagal mengirim error ke server' };
  }
} 