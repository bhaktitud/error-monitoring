import { Request, Response } from 'express';
import { bertErrorAnalyzer } from '../services/bertErrorAnalyzerService';
import { advancedErrorPredictor } from '../services/advancedErrorPredictorService';
import { errorClusteringService } from '../services/errorClusteringService';
import { cacheService } from '../services/cacheService';
import prisma from '../models/prisma';
import { parseStackTrace } from '../utils/stackTraceParser';

// Extend AdvancedErrorPredictor dengan mock methods untuk TypeScript
declare module '../services/advancedErrorPredictorService' {
  interface AdvancedErrorPredictor {
    train(): Promise<void>;
    evaluate(): Promise<any>;
  }
}

// Tipe untuk performanceStats
interface PerformanceStats {
  bert: {
    latency: number;
    cached: boolean;
    cachedLatency?: number;
    cachingBenefit?: string;
  };
  ensemble: {
    latency: number;
    cached: boolean;
    cachedLatency?: number;
    cachingBenefit?: string;
  };
  clustering: {
    latency: number;
    cached: boolean;
    cachedLatency?: number;
    cachingBenefit?: string;
  };
  total: {
    latency: number;
    cachedLatency?: number;
    cachingBenefit?: string;
  };
}

/**
 * Controller untuk fitur ML lanjutan
 */
export class MLController {
  /**
   * Latih model BERT untuk analisis error message
   */
  async trainBertModel(req: Request, res: Response): Promise<void> {
    try {
      await bertErrorAnalyzer.train();
      
      res.status(200).json({
        success: true,
        message: 'Model BERT berhasil dilatih'
      });
    } catch (error) {
      console.error('Error training BERT model:', error);
      res.status(500).json({
        success: false,
        message: `Gagal melatih model BERT: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Menganalisis error dengan model BERT
   */
  async analyzeBertError(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      
      // Ambil data event dari database
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });
      
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event tidak ditemukan'
        });
        return;
      }
      
      // Parse stack trace
      const stackFrames = event.stacktrace ? parseStackTrace(event.stacktrace) : [];
      
      // Buat item untuk analisis
      const item = {
        id: event.id,
        message: event.message,
        errorType: event.errorType,
        stacktrace: event.stacktrace || '',
        stacktraceText: event.stacktrace || '',
        stackFrames,
        browser: event.browser || '',
        os: event.os || '',
        url: event.url || '',
        userAgent: event.userAgent || '',
        probableCause: '',
        metadata: {}
      };
      
      // Analisis dengan model BERT
      const startTime = Date.now();
      const similarErrors = await bertErrorAnalyzer.analyzeError(item);
      const endTime = Date.now();
      
      const causes = await bertErrorAnalyzer.predictCause(item);
      
      res.status(200).json({
        success: true,
        data: {
          similarErrors,
          causes,
          processingTime: endTime - startTime
        }
      });
    } catch (error) {
      console.error('Error analyzing with BERT:', error);
      res.status(500).json({
        success: false,
        message: `Gagal menganalisis dengan BERT: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Latih model ensemble
   */
  async trainEnsembleModel(req: Request, res: Response): Promise<void> {
    try {
      // Mock implementasi - jika sudah diimplementasikan di service, gunakan method asli
      if (typeof advancedErrorPredictor.train === 'function') {
        await advancedErrorPredictor.train();
      } else {
        // Fallback ke trainModel jika ada
        if ('trainModel' in advancedErrorPredictor) {
          await (advancedErrorPredictor as any).trainModel();
        } else {
          throw new Error('Method train tidak diimplementasikan');
        }
      }
      
      res.status(200).json({
        success: true,
        message: 'Model ensemble berhasil dilatih'
      });
    } catch (error) {
      console.error('Error training ensemble model:', error);
      res.status(500).json({
        success: false,
        message: `Gagal melatih model ensemble: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Evaluasi performa model ensemble
   */
  async evaluateEnsembleModel(req: Request, res: Response): Promise<void> {
    try {
      // Mock implementasi - jika sudah diimplementasikan di service, gunakan method asli
      let metrics;
      if (typeof advancedErrorPredictor.evaluate === 'function') {
        metrics = await advancedErrorPredictor.evaluate();
      } else {
        // Fallback ke evaluateModel jika ada
        if ('evaluateModel' in advancedErrorPredictor) {
          // Ambil test data
          const dataset = await import('../utils/datasetGenerator').then(
            module => module.generateTrainingDataset()
          );
          
          // Gunakan sampel kecil untuk evaluasi
          const testData = dataset.slice(0, 10);
          metrics = await (advancedErrorPredictor as any).evaluateModel(testData);
        } else {
          throw new Error('Method evaluate tidak diimplementasikan');
        }
      }
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error evaluating ensemble model:', error);
      res.status(500).json({
        success: false,
        message: `Gagal mengevaluasi model ensemble: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Menganalisis error dengan model ensemble
   */
  async analyzeEnsembleError(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      
      // Ambil data event dari database
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });
      
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event tidak ditemukan'
        });
        return;
      }
      
      // Parse stack trace
      const stackFrames = event.stacktrace ? parseStackTrace(event.stacktrace) : [];
      
      // Buat item untuk analisis
      const item = {
        id: event.id,
        message: event.message,
        errorType: event.errorType,
        stacktrace: event.stacktrace || '',
        stacktraceText: event.stacktrace || '',
        stackFrames,
        browser: event.browser || '',
        os: event.os || '',
        url: event.url || '',
        userAgent: event.userAgent || '',
        probableCause: '',
        metadata: {}
      };
      
      // Analisis dengan model ensemble
      const startTime = Date.now();
      const predictions = await advancedErrorPredictor.predict(item);
      const endTime = Date.now();
      
      res.status(200).json({
        success: true,
        data: {
          predictions,
          processingTime: endTime - startTime
        }
      });
    } catch (error) {
      console.error('Error analyzing with ensemble model:', error);
      res.status(500).json({
        success: false,
        message: `Gagal menganalisis dengan model ensemble: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Menjalankan proses clustering pada semua error
   */
  async runClustering(req: Request, res: Response): Promise<void> {
    try {
      // Initialize clustering service
      await errorClusteringService.initialize();
      
      // Ambil semua event
      const events = await prisma.event.findMany({
        where: {
          stacktrace: {
            not: null
          }
        },
        take: 500 // Batasi jumlah event untuk clustering
      });
      
      // Transform ke format yang sesuai
      const items = events.map(event => {
        const stackFrames = event.stacktrace ? parseStackTrace(event.stacktrace) : [];
        
        return {
          id: event.id,
          message: event.message,
          errorType: event.errorType,
          stacktrace: event.stacktrace || '',
          stacktraceText: event.stacktrace || '',
          stackFrames,
          browser: event.browser || '',
          os: event.os || '',
          url: event.url || '',
          userAgent: event.userAgent || '',
          probableCause: '',
          metadata: {}
        };
      });
      
      // Jalankan clustering
      const startTime = Date.now();
      const clusters = await errorClusteringService.performClustering(items);
      const endTime = Date.now();
      
      res.status(200).json({
        success: true,
        data: {
          clusters: clusters.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            errorCount: c.errorCount
          })),
          totalClusters: clusters.length,
          totalErrors: items.length,
          processingTime: endTime - startTime
        }
      });
    } catch (error) {
      console.error('Error running clustering:', error);
      res.status(500).json({
        success: false,
        message: `Gagal menjalankan clustering: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Mendapatkan daftar semua cluster
   */
  async getClusters(req: Request, res: Response): Promise<void> {
    try {
      await errorClusteringService.initialize();
      
      const clusters = await errorClusteringService.getClusters();
      
      res.status(200).json({
        success: true,
        data: clusters.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          errorCount: c.errorCount,
          errorTypes: c.errorTypes,
          commonMessages: c.commonMessages
        }))
      });
    } catch (error) {
      console.error('Error getting clusters:', error);
      res.status(500).json({
        success: false,
        message: `Gagal mendapatkan cluster: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Mendapatkan detail cluster dan error yang terkait
   */
  async getClusterDetails(req: Request, res: Response): Promise<void> {
    try {
      const { clusterId } = req.params;
      
      await errorClusteringService.initialize();
      
      const cluster = await errorClusteringService.getClusterDetails(clusterId);
      
      if (!cluster) {
        res.status(404).json({
          success: false,
          message: 'Cluster tidak ditemukan'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: cluster
      });
    } catch (error) {
      console.error('Error getting cluster details:', error);
      res.status(500).json({
        success: false,
        message: `Gagal mendapatkan detail cluster: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Menentukan cluster untuk error baru
   */
  async clusterError(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      
      // Ambil data event dari database
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });
      
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event tidak ditemukan'
        });
        return;
      }
      
      // Parse stack trace
      const stackFrames = event.stacktrace ? parseStackTrace(event.stacktrace) : [];
      
      // Buat item untuk analisis
      const item = {
        id: event.id,
        message: event.message,
        errorType: event.errorType,
        stacktrace: event.stacktrace || '',
        stacktraceText: event.stacktrace || '',
        stackFrames,
        browser: event.browser || '',
        os: event.os || '',
        url: event.url || '',
        userAgent: event.userAgent || '',
        probableCause: '',
        metadata: {}
      };
      
      // Inisialisasi service clustering
      await errorClusteringService.initialize();
      
      // Tentukan cluster untuk error
      const startTime = Date.now();
      const clusterResult = await errorClusteringService.clusterNewError(item);
      const endTime = Date.now();
      
      res.status(200).json({
        success: true,
        data: {
          ...clusterResult,
          processingTime: endTime - startTime
        }
      });
    } catch (error) {
      console.error('Error clustering new error:', error);
      res.status(500).json({
        success: false,
        message: `Gagal menentukan cluster untuk error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Mendapatkan statistik performa sistem ML
   */
  async getPerformanceStats(req: Request, res: Response): Promise<void> {
    try {
      // Ambil sample event untuk benchmark
      const sampleEvent = await prisma.event.findFirst({
        where: {
          stacktrace: {
            not: null
          }
        }
      });
      
      if (!sampleEvent) {
        res.status(404).json({
          success: false,
          message: 'Tidak ada event untuk benchmark'
        });
        return;
      }
      
      // Parse stack trace
      const stackFrames = sampleEvent.stacktrace ? parseStackTrace(sampleEvent.stacktrace) : [];
      
      // Buat item untuk benchmark
      const item = {
        id: sampleEvent.id,
        message: sampleEvent.message,
        errorType: sampleEvent.errorType,
        stacktrace: sampleEvent.stacktrace || '',
        stacktraceText: sampleEvent.stacktrace || '',
        stackFrames,
        browser: sampleEvent.browser || '',
        os: sampleEvent.os || '',
        url: sampleEvent.url || '',
        userAgent: sampleEvent.userAgent || '',
        probableCause: '',
        metadata: {}
      };
      
      // Benchmark BERT
      const bertStartTime = Date.now();
      await bertErrorAnalyzer.analyzeError(item);
      const bertTime = Date.now() - bertStartTime;
      
      // Benchmark Ensemble
      const ensembleStartTime = Date.now();
      await advancedErrorPredictor.predict(item);
      const ensembleTime = Date.now() - ensembleStartTime;
      
      // Benchmark Clustering
      const clusteringStartTime = Date.now();
      await errorClusteringService.clusterNewError(item);
      const clusteringTime = Date.now() - clusteringStartTime;
      
      // Statistik performa
      const performanceStats: PerformanceStats = {
        bert: {
          latency: bertTime,
          cached: false
        },
        ensemble: {
          latency: ensembleTime,
          cached: false
        },
        clustering: {
          latency: clusteringTime,
          cached: false
        },
        total: {
          latency: bertTime + ensembleTime + clusteringTime
        }
      };
      
      // Benchmark dengan cache (run kedua)
      const bertCachedStartTime = Date.now();
      await bertErrorAnalyzer.analyzeError(item);
      const bertCachedTime = Date.now() - bertCachedStartTime;
      
      const ensembleCachedStartTime = Date.now();
      await advancedErrorPredictor.predict(item);
      const ensembleCachedTime = Date.now() - ensembleCachedStartTime;
      
      const clusteringCachedStartTime = Date.now();
      await errorClusteringService.clusterNewError(item);
      const clusteringCachedTime = Date.now() - clusteringCachedStartTime;
      
      // Update dengan data cached
      performanceStats.bert.cachedLatency = bertCachedTime;
      performanceStats.bert.cachingBenefit = ((bertTime - bertCachedTime) / bertTime * 100).toFixed(2) + '%';
      
      performanceStats.ensemble.cachedLatency = ensembleCachedTime;
      performanceStats.ensemble.cachingBenefit = ((ensembleTime - ensembleCachedTime) / ensembleTime * 100).toFixed(2) + '%';
      
      performanceStats.clustering.cachedLatency = clusteringCachedTime;
      performanceStats.clustering.cachingBenefit = ((clusteringTime - clusteringCachedTime) / clusteringTime * 100).toFixed(2) + '%';
      
      performanceStats.total.cachedLatency = bertCachedTime + ensembleCachedTime + clusteringCachedTime;
      performanceStats.total.cachingBenefit = ((performanceStats.total.latency - performanceStats.total.cachedLatency!) / performanceStats.total.latency * 100).toFixed(2) + '%';
      
      res.status(200).json({
        success: true,
        data: performanceStats
      });
    } catch (error) {
      console.error('Error getting performance stats:', error);
      res.status(500).json({
        success: false,
        message: `Gagal mendapatkan statistik performa: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Mendapatkan statistik cache
   */
  async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = cacheService.getStats();
      
      res.status(200).json({
        success: true,
        data: {
          ...stats,
          hitRatePercent: (stats.hitRate * 100).toFixed(2) + '%'
        }
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({
        success: false,
        message: `Gagal mendapatkan statistik cache: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Menghapus semua cache
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      cacheService.clear();
      
      res.status(200).json({
        success: true,
        message: 'Cache berhasil dihapus'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        message: `Gagal menghapus cache: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}

// Export singleton instance
export const mlController = new MLController(); 