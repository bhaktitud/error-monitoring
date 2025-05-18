import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { DeploymentAnalyzer } from '../utils/deploymentAnalyzer';

const prisma = new PrismaClient();
const deploymentAnalyzer = new DeploymentAnalyzer();

/**
 * Controller untuk mengelola endpoint terkait deployment
 */
export class DeploymentController {
  /**
   * Mendaftarkan deployment baru
   */
  async registerDeployment(req: Request, res: Response) {
    try {
      const {
        projectId,
        version,
        environment,
        repository,
        branch,
        commitHash,
        commitMessage,
        authorName,
        authorEmail,
        changedFiles,
        metadata
      } = req.body;

      // Validasi input
      if (!projectId || !version || !environment) {
        return res.status(400).json({
          error: 'projectId, version, dan environment harus diisi'
        });
      }

      // Periksa apakah project ada
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return res.status(404).json({
          error: 'Project tidak ditemukan'
        });
      }

      // Buat deployment baru
      const deployment = await prisma.deployment.create({
        data: {
          projectId,
          version,
          environment,
          repository,
          branch,
          commitHash,
          commitMessage,
          authorName,
          authorEmail,
          changedFiles,
          metadata
        }
      });

      res.status(201).json(deployment);
    } catch (error) {
      console.error('Error registering deployment:', error);
      res.status(500).json({ error: 'Gagal mendaftarkan deployment' });
    }
  }

  /**
   * Mendapatkan daftar deployment untuk project tertentu
   */
  async getProjectDeployments(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { environment, limit = '10', skip = '0' } = req.query;

      // Validasi input
      if (!projectId) {
        return res.status(400).json({
          error: 'projectId harus diisi'
        });
      }

      // Filter berdasarkan environment jika ada
      const where: any = { projectId };
      if (environment) {
        where.environment = environment;
      }

      // Ambil deployment
      const deployments = await prisma.deployment.findMany({
        where,
        orderBy: {
          deployedAt: 'desc'
        },
        take: parseInt(limit as string),
        skip: parseInt(skip as string)
      });

      // Hitung total
      const total = await prisma.deployment.count({ where });

      res.json({
        deployments,
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string)
      });
    } catch (error) {
      console.error('Error getting deployments:', error);
      res.status(500).json({ error: 'Gagal mengambil data deployment' });
    }
  }

  /**
   * Mendapatkan detail deployment
   */
  async getDeploymentDetail(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;

      // Validasi input
      if (!deploymentId) {
        return res.status(400).json({
          error: 'deploymentId harus diisi'
        });
      }

      // Ambil deployment
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: {
          relatedErrors: {
            include: {
              errorGroup: {
                select: {
                  id: true,
                  message: true,
                  errorType: true,
                  count: true,
                  firstSeen: true,
                  lastSeen: true
                }
              }
            }
          }
        }
      });

      if (!deployment) {
        return res.status(404).json({
          error: 'Deployment tidak ditemukan'
        });
      }

      res.json(deployment);
    } catch (error) {
      console.error('Error getting deployment detail:', error);
      res.status(500).json({ error: 'Gagal mengambil detail deployment' });
    }
  }

  /**
   * Menganalisis dampak deployment terhadap error
   */
  async analyzeDeploymentImpact(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const { timeWindow } = req.query;

      // Validasi input
      if (!deploymentId) {
        return res.status(400).json({
          error: 'deploymentId harus diisi'
        });
      }

      // Analisis dampak deployment
      const analysis = await deploymentAnalyzer.analyzeDeploymentImpact(
        deploymentId,
        timeWindow ? parseInt(timeWindow as string) : 24
      );

      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing deployment impact:', error);
      res.status(error.message.includes('tidak ditemukan') ? 404 : 500).json({
        error: error.message || 'Gagal menganalisis dampak deployment'
      });
    }
  }

  /**
   * Mengaitkan error group dengan deployment
   */
  async linkErrorToDeployment(req: Request, res: Response) {
    try {
      const { errorGroupId } = req.params;
      const { lookbackDays } = req.query;

      // Validasi input
      if (!errorGroupId) {
        return res.status(400).json({
          error: 'errorGroupId harus diisi'
        });
      }

      // Kaitkan error dengan deployment
      const result = await deploymentAnalyzer.linkErrorToDeployment(
        errorGroupId,
        lookbackDays ? parseInt(lookbackDays as string) : 7
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error linking error to deployment:', error);
      res.status(error.message.includes('tidak ditemukan') ? 404 : 500).json({
        error: error.message || 'Gagal mengaitkan error dengan deployment'
      });
    }
  }

  /**
   * Menganalisis perubahan kode antara dua deployment
   */
  async analyzeCodeChanges(req: Request, res: Response) {
    try {
      const { fromDeploymentId, toDeploymentId } = req.params;

      // Validasi input
      if (!fromDeploymentId || !toDeploymentId) {
        return res.status(400).json({
          error: 'fromDeploymentId dan toDeploymentId harus diisi'
        });
      }

      // Analisis perubahan kode
      const analysis = await deploymentAnalyzer.analyzeCodeChanges(
        fromDeploymentId,
        toDeploymentId
      );

      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing code changes:', error);
      res.status(error.message.includes('tidak ditemukan') ? 404 : 500).json({
        error: error.message || 'Gagal menganalisis perubahan kode'
      });
    }
  }

  /**
   * Mendapatkan error yang muncul setelah deployment
   */
  async getDeploymentErrors(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const { timeframe } = req.query;

      // Validasi input
      if (!deploymentId) {
        return res.status(400).json({
          error: 'deploymentId harus diisi'
        });
      }

      // Ambil error
      const errors = await deploymentAnalyzer.getErrorsForDeployment(
        deploymentId,
        timeframe ? parseInt(timeframe as string) : 24
      );

      res.json(errors);
    } catch (error: any) {
      console.error('Error getting deployment errors:', error);
      res.status(error.message.includes('tidak ditemukan') ? 404 : 500).json({
        error: error.message || 'Gagal mengambil error untuk deployment'
      });
    }
  }
} 