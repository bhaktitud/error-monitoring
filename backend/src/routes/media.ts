import express from 'express';
import { authMiddleware } from '../utils/auth';
import ImageKit from 'imagekit';
import multer from 'multer';

const router = express.Router();

// Inisialisasi ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ''
});

// Konfigurasi multer untuk handling file upload
const upload = multer({
//   storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Endpoint untuk mendapatkan authentication parameters
router.get('/auth', authMiddleware, (req, res) => {
  try {
    // Generate authentication parameters dengan expire time 5 menit ke depan
    const expire = Math.floor(Date.now() / 1000) + 60 * 5; // 5 menit dari sekarang
    const authenticationParameters = imagekit.getAuthenticationParameters(undefined, expire);
    res.json(authenticationParameters);
  } catch (error) {
    console.error('Error generating auth parameters:', error);
    res.status(500).json({ error: 'Gagal menghasilkan parameter autentikasi' });
  }
});

// Endpoint untuk mendapatkan URL endpoint
router.get('/url-endpoint', authMiddleware, (req, res) => {
  try {
    res.json({ urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT });
  } catch (error) {
    console.error('Error getting URL endpoint:', error);
    res.status(500).json({ error: 'Gagal mendapatkan URL endpoint' });
  }
});

// Endpoint untuk upload file
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      useUniqueFileName: true,
      folder: '/uploads',
      responseFields: ['tags', 'customCoordinates', 'isPrivateFile']
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Gagal mengupload file' });
  }
});

// Endpoint untuk mendapatkan daftar file
router.get('/files', authMiddleware, async (req, res) => {
  try {
    const { path = '/', limit = 10, skip = 0, sort = 'DESC_CREATED' } = req.query;
    
    const result = await imagekit.listFiles({
      path: path as string,
      limit: Number(limit),
      skip: Number(skip),
      sort: sort as string
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: 'Gagal mendapatkan daftar file' });
  }
});

// Endpoint untuk mendapatkan detail file
router.get('/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await imagekit.getFileDetails(fileId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting file details:', error);
    res.status(500).json({ error: 'Gagal mendapatkan detail file' });
  }
});

// Endpoint untuk menghapus file
router.delete('/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    await imagekit.deleteFile(fileId);

    res.json({
      success: true,
      message: 'File berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Gagal menghapus file' });
  }
});

// Endpoint untuk mendapatkan URL gambar dengan transformasi
router.get('/url', authMiddleware, (req, res) => {
  try {
    const { path, transformation } = req.query;
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter diperlukan' });
    }

    const url = imagekit.url({
      path: path as string,
      transformation: transformation ? JSON.parse(transformation as string) : undefined
    });

    res.json({
      success: true,
      url
    });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ error: 'Gagal menghasilkan URL' });
  }
});

export default router; 