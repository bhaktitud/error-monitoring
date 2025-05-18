import { Router } from 'express';
import { mlController } from '../controllers/mlController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/ml/bert/train
 * @desc    Melatih model BERT dengan dataset dari database
 * @access  Private
 */
router.post('/bert/train', authenticateToken, mlController.trainBertModel.bind(mlController));

/**
 * @route   GET /api/ml/analyze/bert/:eventId
 * @desc    Menganalisis error dengan model BERT
 * @access  Private
 */
router.get('/analyze/bert/:eventId', authenticateToken, mlController.analyzeBertError.bind(mlController));

/**
 * @route   POST /api/ml/ensemble/train
 * @desc    Melatih model ensemble
 * @access  Private
 */
router.post('/ensemble/train', authenticateToken, mlController.trainEnsembleModel.bind(mlController));

/**
 * @route   POST /api/ml/ensemble/evaluate
 * @desc    Mengevaluasi performa model
 * @access  Private
 */
router.post('/ensemble/evaluate', authenticateToken, mlController.evaluateEnsembleModel.bind(mlController));

/**
 * @route   GET /api/ml/analyze/ensemble/:eventId
 * @desc    Menganalisis error dengan model ensemble
 * @access  Private
 */
router.get('/analyze/ensemble/:eventId', authenticateToken, mlController.analyzeEnsembleError.bind(mlController));

/**
 * @route   POST /api/ml/clustering/run
 * @desc    Menjalankan proses clustering pada semua error
 * @access  Private
 */
router.post('/clustering/run', authenticateToken, mlController.runClustering.bind(mlController));

/**
 * @route   GET /api/ml/clusters
 * @desc    Mendapatkan daftar semua cluster
 * @access  Private
 */
router.get('/clusters', authenticateToken, mlController.getClusters.bind(mlController));

/**
 * @route   GET /api/ml/clusters/:clusterId
 * @desc    Mendapatkan detail cluster dan error yang terkait
 * @access  Private
 */
router.get('/clusters/:clusterId', authenticateToken, mlController.getClusterDetails.bind(mlController));

/**
 * @route   GET /api/ml/cluster-error/:eventId
 * @desc    Menentukan cluster untuk error baru
 * @access  Private
 */
router.get('/cluster-error/:eventId', authenticateToken, mlController.clusterError.bind(mlController));

/**
 * @route   GET /api/ml/performance/stats
 * @desc    Mendapatkan statistik performa sistem ML
 * @access  Private
 */
router.get('/performance/stats', authenticateToken, mlController.getPerformanceStats.bind(mlController));

/**
 * @route   GET /api/ml/cache/stats
 * @desc    Mendapatkan statistik cache
 * @access  Private
 */
router.get('/cache/stats', authenticateToken, mlController.getCacheStats.bind(mlController));

/**
 * @route   POST /api/ml/cache/clear
 * @desc    Menghapus semua cache
 * @access  Private
 */
router.post('/cache/clear', authenticateToken, mlController.clearCache.bind(mlController));

export default router; 