import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import axios from 'axios';
import prisma from '../models/prisma';
import { encrypt, decrypt } from '../utils/encryption';

const router = Router();

// Interface untuk tipe data response Jira
interface JiraResponseData {
  key: string;
  [key: string]: any;
}

// Interface untuk tipe data response metadata Jira
interface JiraMetaResponseData {
  projects: Array<{
    id: string;
    key: string;
    name: string;
    issuetypes: Array<{
      id: string;
      name: string;
      description?: string;
      iconUrl?: string;
    }>;
  }>;
}

/**
 * @route   POST /api/integrations/jira/config
 * @desc    Simpan konfigurasi Jira untuk project
 * @access  Private (Admin)
 */
router.post('/jira/config', 
  authenticateToken,
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('baseUrl').notEmpty().withMessage('Jira base URL is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('apiToken').notEmpty().withMessage('API token is required'),
    body('projectKey').notEmpty().withMessage('Project key is required'),
  ],
  async (req: any, res: any) => {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { projectId, baseUrl, email, apiToken, projectKey } = req.body;
      
      // Validasi akses admin
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId: projectId,
          userId: req.user.id,
          role: {
            in: ['admin', 'owner']
          }
        }
      });
      
      if (!member) {
        return res.status(403).json({
          success: false,
          error: 'Anda tidak memiliki izin untuk mengonfigurasi integrasi'
        });
      }
      
      // Enkripsi API token sebelum disimpan
      const encryptedToken = encrypt(apiToken);
      
      // Uji koneksi ke Jira sebelum menyimpan
      try {
        await axios.get(
          `${baseUrl}/rest/api/2/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes`,
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error: any) {
        console.error('Error testing Jira connection:', error);
        return res.status(400).json({
          success: false,
          error: 'Gagal terhubung ke Jira. Periksa URL, email, token dan project key.'
        });
      }
      
      // Cek apakah konfigurasi sudah ada
      const existingConfig = await prisma.jiraProjectConfig.findUnique({
        where: {
          projectId: projectId
        }
      });
      
      // Simpan atau update konfigurasi
      if (existingConfig) {
        await prisma.jiraProjectConfig.update({
          where: {
            id: existingConfig.id
          },
          data: {
            baseUrl,
            email,
            apiToken: encryptedToken,
            projectKey,
            isActive: true,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.jiraProjectConfig.create({
          data: {
            projectId,
            baseUrl,
            email,
            apiToken: encryptedToken,
            projectKey,
            isActive: true
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Konfigurasi Jira berhasil disimpan'
      });
    } catch (error: any) {
      console.error('Error saving Jira configuration:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error when saving Jira configuration'
      });
    }
  }
);

/**
 * @route   GET /api/integrations/jira/config/:projectId
 * @desc    Get Jira configuration for a project
 * @access  Private
 */
router.get('/jira/config/:projectId', 
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      
      // Validasi akses ke project
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId: projectId,
          userId: req.user.id
        }
      });
      
      if (!member) {
        return res.status(403).json({
          success: false,
          error: 'Anda tidak memiliki akses ke project ini'
        });
      }
      
      // Ambil konfigurasi
      const config = await prisma.jiraProjectConfig.findUnique({
        where: {
          projectId: projectId
        }
      });
      
      if (!config) {
        return res.status(404).json({
          success: false,
          connected: false,
          message: 'Konfigurasi Jira belum diatur'
        });
      }
      
      // Jangan kirim token API ke client, hanya informasi apakah terhubung
      return res.status(200).json({
        success: true,
        connected: config.isActive,
        baseUrl: config.baseUrl,
        email: config.email,
        projectKey: config.projectKey,
        hasApiToken: true
      });
    } catch (error: any) {
      console.error('Error fetching Jira configuration:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error when fetching Jira configuration'
      });
    }
  }
);

/**
 * @route   DELETE /api/integrations/jira/config/:projectId
 * @desc    Delete Jira configuration for a project
 * @access  Private (Admin)
 */
router.delete('/jira/config/:projectId', 
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      
      // Validasi akses admin
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId: projectId,
          userId: req.user.id,
          role: {
            in: ['admin', 'owner']
          }
        }
      });
      
      if (!member) {
        return res.status(403).json({
          success: false,
          error: 'Anda tidak memiliki izin untuk menghapus konfigurasi'
        });
      }
      
      // Hapus konfigurasi
      await prisma.jiraProjectConfig.delete({
        where: {
          projectId: projectId
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Konfigurasi Jira berhasil dihapus'
      });
    } catch (error: any) {
      console.error('Error deleting Jira configuration:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error when deleting Jira configuration'
      });
    }
  }
);

/**
 * @route   GET /api/integrations/jira/issuetypes
 * @desc    Get available issue types for a Jira project
 * @access  Private
 */
router.get('/jira/issuetypes/:projectId', 
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const { projectId } = req.params;
      
      // Ambil konfigurasi Jira
      const config = await prisma.jiraProjectConfig.findUnique({
        where: {
          projectId: projectId,
          isActive: true
        }
      });
      
      if (!config) {
        return res.status(404).json({ 
          success: false, 
          error: 'Konfigurasi Jira tidak ditemukan atau tidak aktif' 
        });
      }
      
      // Dekripsi token API
      const apiToken = decrypt(config.apiToken);
      
      // Ambil metadata proyek untuk mendapatkan tipe issue yang tersedia
      const response = await axios.get(
        `${config.baseUrl}/rest/api/2/issue/createmeta?projectKeys=${config.projectKey}&expand=projects.issuetypes`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${config.email}:${apiToken}`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Type assertion untuk response.data
      const responseData = response.data as JiraMetaResponseData;
      const projects = responseData.projects;
      if (projects && projects.length > 0) {
        // Kirim daftar tipe issue yang tersedia
        return res.json({
          success: true,
          issueTypes: projects[0].issuetypes || []
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'No project found with the given key'
        });
      }
    } catch (error: any) {
      console.error('Error fetching Jira issue types:', error);
      
      if (error.response && error.response.data) {
        return res.status(error.response.status || 500).json({
          success: false,
          error: 'Failed to fetch Jira issue types',
          details: error.response.data
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Server error when fetching Jira issue types'
      });
    }
  }
);

/**
 * @route   POST /api/integrations/jira/issues
 * @desc    Create a Jira issue from error details
 * @access  Private
 */
router.post('/jira/issues', 
  authenticateToken,
  [
    body('groupId').notEmpty().withMessage('Error group ID is required'),
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('summary').notEmpty().withMessage('Summary is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('issueTypeId').notEmpty().withMessage('Issue type ID is required'),
  ], 
  async (req: any, res: any) => {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { projectId, summary, description, groupId, errorId, issueTypeId } = req.body;
      
      // Ambil konfigurasi Jira dari database
      const config = await prisma.jiraProjectConfig.findUnique({
        where: {
          projectId: projectId,
          isActive: true
        }
      });
      
      if (!config) {
        return res.status(404).json({ 
          success: false, 
          error: 'Konfigurasi Jira tidak ditemukan atau tidak aktif' 
        });
      }
      
      // Dekripsi token API
      const apiToken = decrypt(config.apiToken);

      // Buat issue di Jira menggunakan konfigurasi yang tersimpan
      const jiraResponse = await axios.post(
        `${config.baseUrl}/rest/api/2/issue`,
        {
          fields: {
            project: {
              key: config.projectKey
            },
            summary: summary,
            description: description,
            issuetype: {
              id: issueTypeId
            }
          }
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${config.email}:${apiToken}`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Casting response data ke tipe JiraResponseData
      const responseData = jiraResponse.data as JiraResponseData;

      // Simpan referensi issue ke database jika berhasil
      if (responseData && responseData.key) {
        // Cari ProjectMember ID untuk user saat ini pada project
        const projectMember = await prisma.projectMember.findFirst({
          where: {
            projectId: projectId,
            userId: req.user.id
          }
        });

        if (!projectMember) {
          throw new Error('User is not a member of this project');
        }

        const jiraIssue = await prisma.jiraIntegration.create({
          data: {
            jiraIssueKey: responseData.key,
            jiraIssueUrl: `${config.baseUrl}/browse/${responseData.key}`,
            groupId: groupId,
            errorId: errorId,
            createdById: projectMember.id // Gunakan ProjectMember ID
          }
        });

        return res.status(201).json({
          success: true,
          jiraIssue: {
            key: responseData.key,
            url: `${config.baseUrl}/browse/${responseData.key}`,
            id: jiraIssue.id
          }
        });
      } else {
        throw new Error('Failed to create Jira issue');
      }
    } catch (error: any) {
      console.error('Error creating Jira issue:', error);
      
      // Handle specific Jira API errors
      if (error.response && error.response.data) {
        return res.status(error.response.status || 500).json({
          success: false,
          error: 'Failed to create Jira issue',
          details: error.response.data
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Server error when creating Jira issue'
      });
    }
  }
);

/**
 * @route   GET /api/integrations/jira/issues/:groupId
 * @desc    Get Jira issues linked to an error group
 * @access  Private
 */
router.get('/jira/issues/:groupId', authenticateToken, async (req: any, res: any) => {
  try {
    const { groupId } = req.params;
    
    const jiraIssues = await prisma.jiraIntegration.findMany({
      where: {
        groupId: groupId
      },
      include: {
        createdBy: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format response untuk memenuhi kebutuhan API
    const formattedIssues = jiraIssues.map(issue => ({
      id: issue.id,
      jiraIssueKey: issue.jiraIssueKey,
      jiraIssueUrl: issue.jiraIssueUrl,
      groupId: issue.groupId,
      errorId: issue.errorId,
      createdAt: issue.createdAt,
      createdBy: {
        email: issue.createdBy.user.email
      }
    }));
    
    return res.json(formattedIssues);
  } catch (error) {
    console.error('Error fetching Jira issues:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error when fetching Jira issues'
    });
  }
});

export default router; 