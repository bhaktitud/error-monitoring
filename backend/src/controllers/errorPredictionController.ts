import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { 
  predictErrorCause, 
  predictErrorGroupCause, 
  trainErrorPredictor,
  evaluateErrorPredictor
} from '../services/errorPredictor';

/**
 * Mendapatkan prediksi penyebab error untuk event tertentu
 */
export async function getEventErrorPrediction(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    
    // Cek apakah event ada
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    // Cek apakah sudah ada prediksi untuk event ini
    const existingPrediction = await prisma.errorPrediction.findFirst({
      where: { eventId }
    });
    
    if (existingPrediction) {
      // Jika sudah ada, kembalikan hasil yang sudah ada
      return res.json({
        id: existingPrediction.id,
        eventId: existingPrediction.eventId,
        groupId: existingPrediction.groupId,
        probableCauses: JSON.parse(existingPrediction.probableCauses as string),
        predictionTime: existingPrediction.predictionTime,
        modelVersion: existingPrediction.modelVersion,
        createdAt: existingPrediction.createdAt
      });
    }
    
    // Jika belum ada, lakukan prediksi baru
    const prediction = await predictErrorCause(eventId);
    
    res.json(prediction);
  } catch (error) {
    console.error('Error in getEventErrorPrediction:', error);
    res.status(500).json({ 
      error: 'Gagal memprediksi penyebab error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Mendapatkan prediksi penyebab error untuk grup error
 */
export async function getGroupErrorPrediction(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    
    // Cek apakah grup ada
    const group = await prisma.errorGroup.findUnique({
      where: { id: groupId }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Grup error tidak ditemukan' });
    }
    
    // Cek apakah sudah ada prediksi untuk grup ini
    const existingPrediction = await prisma.errorPrediction.findFirst({
      where: { groupId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (existingPrediction) {
      // Jika sudah ada dan masih baru (< 1 hari), kembalikan hasil yang sudah ada
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      if (existingPrediction.createdAt > oneDayAgo) {
        return res.json({
          id: existingPrediction.id,
          eventId: existingPrediction.eventId,
          groupId: existingPrediction.groupId,
          probableCauses: JSON.parse(existingPrediction.probableCauses as string),
          predictionTime: existingPrediction.predictionTime,
          modelVersion: existingPrediction.modelVersion,
          createdAt: existingPrediction.createdAt
        });
      }
    }
    
    // Jika belum ada atau sudah lama, lakukan prediksi baru
    const prediction = await predictErrorGroupCause(groupId);
    
    res.json(prediction);
  } catch (error) {
    console.error('Error in getGroupErrorPrediction:', error);
    res.status(500).json({ 
      error: 'Gagal memprediksi penyebab error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Melatih model prediksi error
 * Hanya untuk admin
 */
export async function trainModel(req: Request, res: Response) {
  try {
    const result = await trainErrorPredictor();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in trainModel:', error);
    res.status(500).json({ 
      error: 'Gagal melatih model prediksi',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Mengevaluasi model prediksi error
 * Hanya untuk admin
 */
export async function evaluateModel(req: Request, res: Response) {
  try {
    const { testPercentage } = req.query;
    const percentage = testPercentage ? parseFloat(testPercentage as string) : 0.2;
    
    // Validasi persentase
    if (percentage <= 0 || percentage >= 1) {
      return res.status(400).json({ 
        error: 'Parameter testPercentage harus di antara 0 dan 1' 
      });
    }
    
    const result = await evaluateErrorPredictor(percentage);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in evaluateModel:', error);
    res.status(500).json({ 
      error: 'Gagal mengevaluasi model prediksi',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 