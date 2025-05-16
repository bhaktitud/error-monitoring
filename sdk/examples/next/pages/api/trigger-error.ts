import type { NextApiRequest, NextApiResponse } from 'next';
import { captureException, logError } from '../../lib/lograven';

type ResponseData = {
  message: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // Simulasikan error 
    if (req.query.error === 'true') {
      throw new Error('API error yang disengaja dari server-side');
    }

    // Response sukses jika tidak ada error
    res.status(200).json({ message: 'API berfungsi dengan baik!' });
  } catch (error) {
    // Tangkap dan laporkan error ke LogRaven
    console.error('Server error:', error);
    logError(error, { 
      source: 'API Route', 
      endpoint: '/api/trigger-error',
      query: req.query 
    });
    
    // Kirim response error
    res.status(500).json({ message: 'Terjadi error di server yang telah dilaporkan ke LogRaven' });
  }
} 