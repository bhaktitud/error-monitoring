import express from 'express';
import { getSystemContext, filterErrorsBySystemConditions } from '../controllers/systemContextController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/projects/:projectId/system-context
 * @desc Mendapatkan analisis konteks sistem untuk project
 * @access Private
 */
router.get('/projects/:projectId/system-context', authenticateToken, getSystemContext);

/**
 * @route POST /api/projects/:projectId/system-context/filter
 * @desc Memfilter error berdasarkan kondisi sistem
 * @access Private
 */
router.post('/projects/:projectId/system-context/filter', authenticateToken, filterErrorsBySystemConditions);

export default router; 