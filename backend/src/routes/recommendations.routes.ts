import { Router } from 'express';
import recommendationsController from '../controllers/recommendations.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Mendapatkan rekomendasi untuk error tertentu
router.get('/errors/:errorId/recommendations', authenticateToken, recommendationsController.getRecommendationsForError);

// Memberikan feedback untuk rekomendasi
router.post('/recommendations/:recommendationId/feedback', authenticateToken, recommendationsController.provideFeedback);

// Menandai rekomendasi sebagai sudah diterapkan
router.post('/recommendations/:recommendationId/apply', authenticateToken, recommendationsController.markAsApplied);

// Mendapatkan daftar knowledge base error
router.get('/knowledge-base', authenticateToken, recommendationsController.getKnowledgeBase);

export default router; 