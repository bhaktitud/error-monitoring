import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { 
  findRootCauseAnalysis, 
  initiateRootCauseAnalysis, 
  formatRootCauseAnalysis 
} from '../services/rootCauseAnalysisService';
import {
  findSimilarErrors,
  findCoOccurringErrors
} from '../utils/errorSimilarityAnalyzer';

/**
 * Controller untuk mendapatkan analisis akar masalah untuk event tertentu
 */
export async function getEventRootCause(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    
    // Cek apakah event ada
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }

    // Cari analisis yang sudah ada
    let analysis = await findRootCauseAnalysis(eventId);
    
    // Jika belum ada, inisiasi analisis baru
    if (!analysis) {
      analysis = await initiateRootCauseAnalysis(eventId);
    }

    // Format hasil untuk API response
    const formattedResult = formatRootCauseAnalysis(analysis);
    
    res.json(formattedResult);
  } catch (error) {
    console.error('Error in getEventRootCause:', error);
    res.status(500).json({ error: 'Gagal menganalisis akar masalah error' });
  }
}

/**
 * Controller untuk mendapatkan analisis akar masalah untuk grup error
 */
export async function getGroupRootCause(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    
    // Cek apakah grup ada
    const group = await prisma.errorGroup.findUnique({
      where: { id: groupId }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Grup error tidak ditemukan' });
    }

    // Ambil event terbaru dari grup ini
    const latestEvent = await prisma.event.findFirst({
      where: { groupId },
      orderBy: { timestamp: 'desc' }
    });
    
    if (!latestEvent) {
      return res.status(404).json({ error: 'Tidak ada event dalam grup ini' });
    }

    // Gunakan event terbaru untuk analisis
    let analysis = await findRootCauseAnalysis(latestEvent.id);
    
    // Jika belum ada, inisiasi analisis baru
    if (!analysis) {
      analysis = await initiateRootCauseAnalysis(latestEvent.id);
    }

    // Format hasil untuk API response
    const formattedResult = formatRootCauseAnalysis(analysis);
    
    // Tambah info tambahan tentang grup
    const response = {
      ...formattedResult,
      group: {
        id: group.id,
        errorType: group.errorType,
        message: group.message,
        count: group.count,
        status: group.status
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in getGroupRootCause:', error);
    res.status(500).json({ error: 'Gagal menganalisis akar masalah grup error' });
  }
}

/**
 * Controller untuk mendapatkan error yang mirip dengan suatu event
 */
export async function getSimilarErrors(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { threshold = '0.7', limit = '10' } = req.query;
    
    // Validasi parameter
    const thresholdValue = parseFloat(threshold as string);
    const limitValue = parseInt(limit as string, 10);
    
    if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 1) {
      return res.status(400).json({ error: 'Threshold harus berupa angka antara 0 dan 1' });
    }
    
    if (isNaN(limitValue) || limitValue < 1) {
      return res.status(400).json({ error: 'Limit harus berupa angka positif' });
    }
    
    // Cek apakah event ada
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' });
    }
    
    // Cari error yang mirip
    const similarErrors = await findSimilarErrors(eventId, thresholdValue, limitValue);
    
    res.json({
      eventId,
      similarErrors,
      total: similarErrors.length
    });
  } catch (error) {
    console.error('Error in getSimilarErrors:', error);
    res.status(500).json({ error: 'Gagal mencari error yang mirip' });
  }
}

/**
 * Controller untuk mendapatkan error yang sering terjadi bersamaan dengan suatu grup error
 */
export async function getCoOccurringErrors(req: Request, res: Response) {
  try {
    const { groupId } = req.params;
    const { timeWindow = '60', limit = '10' } = req.query;
    
    // Validasi parameter
    const timeWindowValue = parseInt(timeWindow as string, 10);
    const limitValue = parseInt(limit as string, 10);
    
    if (isNaN(timeWindowValue) || timeWindowValue < 1) {
      return res.status(400).json({ error: 'Time window harus berupa angka positif (menit)' });
    }
    
    if (isNaN(limitValue) || limitValue < 1) {
      return res.status(400).json({ error: 'Limit harus berupa angka positif' });
    }
    
    // Cek apakah grup error ada
    const group = await prisma.errorGroup.findUnique({
      where: { id: groupId }
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Grup error tidak ditemukan' });
    }
    
    // Cari error yang sering terjadi bersamaan
    const coOccurringErrors = await findCoOccurringErrors(groupId, timeWindowValue, limitValue);
    
    res.json({
      groupId,
      timeWindowMinutes: timeWindowValue,
      coOccurringErrors,
      total: coOccurringErrors.length
    });
  } catch (error) {
    console.error('Error in getCoOccurringErrors:', error);
    res.status(500).json({ error: 'Gagal mencari error yang terjadi bersamaan' });
  }
} 