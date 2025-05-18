import { Request, Response } from 'express';
import { SystemContextAnalyzer } from '../utils/systemContextAnalyzer';

// Inisialisasi instance analyzer
const systemContextAnalyzer = new SystemContextAnalyzer();

/**
 * Controller untuk mendapatkan data konteks sistem
 */
export async function getSystemContext(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const { timeframe = '7', errorGroupId } = req.query;
    
    // Konversi timeframe ke angka hari
    const days = parseInt(timeframe as string, 10) || 7;
    
    // Analisis data browser, device, OS
    const { browserData, osData, deviceData } = await systemContextAnalyzer.analyzeBrowserDeviceData(
      projectId,
      days
    );
    
    // Analisis data jaringan
    const { methodData, statusCodeData, pathData } = await systemContextAnalyzer.analyzeNetworkData(
      projectId,
      days
    );
    
    // Identifikasi pola error
    const { correlations, recommendations } = await systemContextAnalyzer.identifyErrorPatterns(
      projectId,
      errorGroupId as string | undefined,
      days
    );
    
    // Gabungkan semua data untuk response
    const response = {
      browserData,
      osData,
      deviceData,
      methodData,
      statusCodeData,
      pathData,
      correlations,
      recommendations
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in getSystemContext:', error);
    res.status(500).json({ error: 'Gagal menganalisis konteks sistem' });
  }
}

/**
 * Controller untuk memfilter error berdasarkan kondisi sistem
 */
export async function filterErrorsBySystemConditions(req: Request, res: Response) {
  try {
    const { projectId } = req.params;
    const conditions = req.body;
    
    if (!conditions || Object.keys(conditions).length === 0) {
      return res.status(400).json({ error: 'Kondisi filter tidak valid' });
    }
    
    // Filter error berdasarkan kondisi
    const filteredErrors = await systemContextAnalyzer.getFilteredErrors(
      projectId,
      conditions
    );
    
    res.json(filteredErrors);
  } catch (error) {
    console.error('Error in filterErrorsBySystemConditions:', error);
    res.status(500).json({ error: 'Gagal memfilter error berdasarkan kondisi sistem' });
  }
} 