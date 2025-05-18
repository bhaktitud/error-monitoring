import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import solutionRecommender from '../services/solutionRecommender';

const prisma = new PrismaClient();

/**
 * Controller untuk menangani endpoints terkait rekomendasi solusi error
 */
export class RecommendationsController {
  /**
   * Mendapatkan rekomendasi untuk error tertentu
   */
  async getRecommendationsForError(req: Request, res: Response) {
    try {
      const { errorId } = req.params;

      // Validasi error ID
      if (!errorId) {
        return res.status(400).json({ error: 'Error ID diperlukan' });
      }

      // Periksa apakah error ada
      const error = await prisma.event.findUnique({
        where: { id: errorId },
      });

      if (!error) {
        return res.status(404).json({ error: 'Error tidak ditemukan' });
      }

      // Cek rekomendasi yang sudah ada di database
      const existingRecommendations = await prisma.solutionRecommendation.findMany({
        where: { errorId },
        orderBy: { relevanceScore: 'desc' },
      });

      // Jika sudah ada rekomendasi, kembalikan
      if (existingRecommendations.length > 0) {
        return res.json({ data: existingRecommendations });
      }

      // Jika belum ada, minta rekomendasi baru
      const recommendations = await solutionRecommender.getRecommendations(errorId);
      
      return res.json({ data: recommendations });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return res.status(500).json({ error: 'Gagal mendapatkan rekomendasi' });
    }
  }

  /**
   * Menerima feedback untuk rekomendasi
   */
  async provideFeedback(req: Request, res: Response) {
    try {
      const { recommendationId } = req.params;
      const { feedback } = req.body;

      // Validasi input
      if (!recommendationId) {
        return res.status(400).json({ error: 'Recommendation ID diperlukan' });
      }

      if (!feedback || !['helpful', 'not_helpful'].includes(feedback)) {
        return res.status(400).json({ error: 'Feedback harus berupa "helpful" atau "not_helpful"' });
      }

      // Update rekomendasi dengan feedback
      const updatedRecommendation = await prisma.solutionRecommendation.update({
        where: { id: recommendationId },
        data: { feedback },
      });

      return res.json({ 
        success: true, 
        message: 'Feedback diterima', 
        recommendation: updatedRecommendation
      });
    } catch (error) {
      console.error('Error providing feedback:', error);
      return res.status(500).json({ error: 'Gagal menyimpan feedback' });
    }
  }

  /**
   * Menandai solusi sebagai diterapkan
   */
  async markAsApplied(req: Request, res: Response) {
    try {
      const { recommendationId } = req.params;

      // Validasi input
      if (!recommendationId) {
        return res.status(400).json({ error: 'Recommendation ID diperlukan' });
      }

      // Update rekomendasi sebagai diterapkan
      const updatedRecommendation = await prisma.solutionRecommendation.update({
        where: { id: recommendationId },
        data: { 
          isApplied: true,
          appliedAt: new Date()
        },
      });

      return res.json({ 
        success: true, 
        message: 'Solusi ditandai sebagai diterapkan', 
        recommendation: updatedRecommendation
      });
    } catch (error) {
      console.error('Error marking as applied:', error);
      return res.status(500).json({ error: 'Gagal menandai solusi sebagai diterapkan' });
    }
  }

  /**
   * Mendapatkan entries knowledge base
   */
  async getKnowledgeBase(req: Request, res: Response) {
    try {
      const { errorType, search } = req.query;
      
      // Membangun filter
      const filter: any = {};
      
      if (errorType) {
        filter.errorType = errorType.toString();
      }
      
      if (search) {
        const searchTerm = search.toString();
        filter.OR = [
          { pattern: { contains: searchTerm, mode: 'insensitive' } },
          { solutionTitle: { contains: searchTerm, mode: 'insensitive' } },
          { solutionDescription: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
      
      // Mendapatkan data knowledge base
      const knowledgeBase = await prisma.errorKnowledgeBase.findMany({
        where: filter,
        orderBy: { successRate: 'desc' },
      });
      
      return res.json({ data: knowledgeBase });
    } catch (error) {
      console.error('Error getting knowledge base:', error);
      return res.status(500).json({ error: 'Gagal mendapatkan knowledge base' });
    }
  }
}

export default new RecommendationsController(); 