import express from 'express';
import { DeploymentController } from '../controllers/deploymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const deploymentController = new DeploymentController();

/**
 * @swagger
 * /api/deployments:
 *   post:
 *     summary: Mendaftarkan deployment baru
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - version
 *               - environment
 *             properties:
 *               projectId:
 *                 type: string
 *               version:
 *                 type: string
 *               environment:
 *                 type: string
 *               repository:
 *                 type: string
 *               branch:
 *                 type: string
 *               commitHash:
 *                 type: string
 *               commitMessage:
 *                 type: string
 *               authorName:
 *                 type: string
 *               authorEmail:
 *                 type: string
 *               changedFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Deployment berhasil dibuat
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Tidak terotentikasi
 *       404:
 *         description: Project tidak ditemukan
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, deploymentController.registerDeployment.bind(deploymentController));

/**
 * @swagger
 * /api/deployments/projects/{projectId}:
 *   get:
 *     summary: Mendapatkan daftar deployment untuk project tertentu
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: environment
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Daftar deployment berhasil diambil
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Tidak terotentikasi
 *       500:
 *         description: Server error
 */
router.get('/projects/:projectId', authenticateToken, deploymentController.getProjectDeployments.bind(deploymentController));

/**
 * @swagger
 * /api/deployments/{deploymentId}:
 *   get:
 *     summary: Mendapatkan detail deployment
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deploymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail deployment berhasil diambil
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Tidak terotentikasi
 *       404:
 *         description: Deployment tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get('/:deploymentId', authenticateToken, deploymentController.getDeploymentDetail.bind(deploymentController));

/**
 * @swagger
 * /api/insights/deployments/{deploymentId}/impact:
 *   get:
 *     summary: Menganalisis dampak deployment terhadap error
 *     tags: [Deployment Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deploymentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *           default: 24
 *     responses:
 *       200:
 *         description: Analisis berhasil
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Tidak terotentikasi
 *       404:
 *         description: Deployment tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get('/insights/deployments/:deploymentId/impact', authenticateToken, deploymentController.analyzeDeploymentImpact.bind(deploymentController));

/**
 * @swagger
 * /api/insights/errors/{errorGroupId}/deployment:
 *   get:
 *     summary: Mengaitkan error group dengan deployment
 *     tags: [Deployment Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: errorGroupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: lookbackDays
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Berhasil mengaitkan error dengan deployment
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Tidak terotentikasi
 *       404:
 *         description: Error group tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get('/insights/errors/:errorGroupId/deployment', authenticateToken, deploymentController.linkErrorToDeployment.bind(deploymentController));

/**
 * @swagger
 * /api/insights/deployments/{fromDeploymentId}/changes/{toDeploymentId}:
 *   get:
 *     summary: Menganalisis perubahan kode antara dua deployment
 *     tags: [Deployment Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fromDeploymentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: toDeploymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analisis berhasil
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Tidak terotentikasi
 *       404:
 *         description: Deployment tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get('/insights/deployments/:fromDeploymentId/changes/:toDeploymentId', authenticateToken, deploymentController.analyzeCodeChanges.bind(deploymentController));

/**
 * @swagger
 * /api/insights/deployments/{deploymentId}/errors:
 *   get:
 *     summary: Mendapatkan error yang muncul setelah deployment
 *     tags: [Deployment Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deploymentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: integer
 *           default: 24
 *     responses:
 *       200:
 *         description: Berhasil mengambil data error
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Tidak terotentikasi
 *       404:
 *         description: Deployment tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get('/insights/deployments/:deploymentId/errors', authenticateToken, deploymentController.getDeploymentErrors.bind(deploymentController));

export default router; 