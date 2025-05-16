import type { NextApiRequest, NextApiResponse } from 'next';
import { init, captureException } from '@lograven/sdk';

// Inisialisasi LogRaven SDK tanpa fitur NestJS khusus
init({
  dsn: '6369f64f-261b-4b3e-bd7c-309127deaf3a',
  environment: 'development',
  release: '1.0.0',
  apiUrl: 'http://localhost:3000'
});

type ResponseData = {
  message: string;
  info?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // Penanganan error yang aman tanpa menggunakan NestJS adapter
    console.log('API dipanggil tanpa NestJS adapter');
    
    // Simulasikan error jika diperlukan
    if (req.query.error === 'true') {
      throw new Error('API error yang dibuat tanpa NestJS adapter');
    }

    // Response sukses jika tidak ada error
    res.status(200).json({ 
      message: 'API berfungsi dengan baik!',
      info: 'Endpoint ini tidak menggunakan NestJS adapter'
    });
  } catch (error) {
    // Tangkap dan laporkan error ke LogRaven
    console.error('Safe API error:', error);
    captureException(error);
    
    // Kirim response error
    res.status(500).json({ 
      message: 'Terjadi error di server yang telah dilaporkan ke LogRaven',
      info: 'Error ditangkap tanpa NestJS adapter'
    });
  }
} 