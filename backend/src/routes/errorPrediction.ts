import express from 'express';
import { 
  getEventErrorPrediction,
  getGroupErrorPrediction,
  trainModel,
  evaluateModel
} from '../controllers/errorPredictionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware untuk membatasi akses hanya untuk admin
const checkAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Pastikan user sudah terotentikasi (authenticateToken sudah dipanggil sebelumnya)
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Cek apakah user adalah admin (asumsi ada properti isAdmin atau admin atau role)
  // Sesuaikan dengan struktur user di aplikasi
  if (user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ error: 'Forbidden: Hanya admin yang dapat mengakses' });
};

// Mendapatkan prediksi error untuk event tertentu
router.get('/events/:eventId/prediction', authenticateToken, getEventErrorPrediction);

// Mendapatkan prediksi error untuk grup error
router.get('/groups/:groupId/prediction', authenticateToken, getGroupErrorPrediction);

// Melatih model (hanya admin)
router.post('/model/train', authenticateToken, checkAdmin, trainModel);

// Mengevaluasi model (hanya admin)
router.get('/model/evaluate', authenticateToken, checkAdmin, evaluateModel);

export default router;