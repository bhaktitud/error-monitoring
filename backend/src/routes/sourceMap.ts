import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { validateDsn } from '../utils/dsnUtils';

const prisma = new PrismaClient();
const router = express.Router();

// Konfigurasi multer untuk menyimpan file di memori
const upload = multer({ storage: multer.memoryStorage() });

// Middleware untuk validasi DSN
const dsnMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const dsn = req.headers['x-dsn'] as string;
    if (!dsn) {
      return res.status(401).json({ error: 'DSN diperlukan' });
    }

    const project = await validateDsn(dsn);
    if (!project) {
      return res.status(401).json({ error: 'DSN tidak valid' });
    }

    (req as any).project = project;
    next();
  } catch (error) {
    console.error('Error validating DSN:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat validasi DSN' });
  }
};

// Upload source map - Endpoint ini dipanggil oleh SDK
router.post('/api/sourcemaps', dsnMiddleware, async (req, res) => {
  try {
    const { release, sourceMap, sourceFile, minifiedFile, environment } = req.body;
    const project = (req as any).project;

    if (!release || !sourceMap || !sourceFile) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap. release, sourceMap, dan sourceFile diperlukan' 
      });
    }

    // Validasi sourceMap dasar
    if (!sourceMap.version || !sourceMap.sources || !sourceMap.mappings) {
      return res.status(400).json({ error: 'Format source map tidak valid' });
    }

    // Ekstrak nama file dari path sourceFile
    const filename = sourceFile.split('/').pop() || sourceFile;
    
    // Cek apakah source map dengan kombinasi projectId, release, dan sourceFile sudah ada
    const existingSourceMap = await prisma.sourceMap.findUnique({
      where: {
        projectId_release_sourceFile: {
          projectId: project.id,
          release,
          sourceFile,
        },
      },
    });

    // Jika sudah ada, update
    if (existingSourceMap) {
      const updatedSourceMap = await prisma.sourceMap.update({
        where: {
          id: existingSourceMap.id,
        },
        data: {
          sourceMap,
          minifiedFile: minifiedFile || sourceFile,
          filename,
          environment,
          originalFiles: sourceMap.sources,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        id: updatedSourceMap.id,
        message: 'Source map berhasil diperbarui',
      });
    }

    // Jika belum ada, buat baru
    const newSourceMap = await prisma.sourceMap.create({
      data: {
        id: uuidv4(),
        projectId: project.id,
        release,
        sourceFile,
        minifiedFile: minifiedFile || sourceFile,
        sourceMap,
        filename,
        environment,
        originalFiles: sourceMap.sources,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.status(201).json({
      id: newSourceMap.id,
      message: 'Source map berhasil diunggah',
    });
  } catch (error) {
    console.error('Error uploading source map:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengunggah source map' });
  }
});

// Endpoint baru untuk upload source map dari frontend
router.post(
  '/api/projects/:projectId/sourcemaps/upload',
  authenticateToken, // Gunakan auth user
  upload.single('sourceMapFile'), // Middleware multer untuk file
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { release, sourceFile, minifiedFile, environment } = req.body;
      const file = req.file;
      const user = (req as any).user;

      // Validasi input
      if (!release || !sourceFile || !file) {
        return res.status(400).json({ 
          error: 'Data tidak lengkap. release, sourceFile, dan file sourceMap diperlukan' 
        });
      }

      // Pastikan user adalah member dari project
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
        },
      });
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      const isOwner = project?.ownerId === user.id;

      if (!isOwner && !projectMember) {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk mengupload source map ke project ini' });
      }

      // Baca konten file source map
      let sourceMapContent;
      try {
        sourceMapContent = JSON.parse(file.buffer.toString('utf-8'));
      } catch (e) {
        return res.status(400).json({ error: 'File source map tidak valid (bukan JSON)' });
      }

      // Validasi sourceMap dasar
      if (!sourceMapContent.version || !sourceMapContent.sources || !sourceMapContent.mappings) {
        return res.status(400).json({ error: 'Format source map tidak valid' });
      }

      const filename = sourceFile.split('/').pop() || sourceFile; // Gunakan sourceFile untuk nama file
      const actualMinifiedFile = minifiedFile || sourceFile; // Default minified file ke source file

      // Cek apakah source map dengan kombinasi projectId, release, dan sourceFile sudah ada
      const existingSourceMap = await prisma.sourceMap.findUnique({
        where: {
          projectId_release_sourceFile: {
            projectId,
            release,
            sourceFile: actualMinifiedFile, // Gunakan minifiedFile (atau sourceFile jika tidak ada) untuk unique key
          },
        },
      });

      // Jika sudah ada, update
      if (existingSourceMap) {
        const updatedSourceMap = await prisma.sourceMap.update({
          where: {
            id: existingSourceMap.id,
          },
          data: {
            sourceMap: sourceMapContent,
            filename, // Nama file asli
            sourceFile: sourceFile, // File source utama
            minifiedFile: actualMinifiedFile,
            environment,
            originalFiles: sourceMapContent.sources,
            fileSize: file.size,
            contentType: file.mimetype,
            uploadedBy: user.id,
            updatedAt: new Date(),
          },
        });
        return res.status(200).json({ id: updatedSourceMap.id, message: 'Source map berhasil diperbarui' });
      }

      // Jika belum ada, buat baru
      const newSourceMap = await prisma.sourceMap.create({
        data: {
          id: uuidv4(),
          projectId,
          release,
          sourceFile: sourceFile, // File source utama
          minifiedFile: actualMinifiedFile,
          sourceMap: sourceMapContent,
          filename,
          environment,
          originalFiles: sourceMapContent.sources,
          fileSize: file.size,
          contentType: file.mimetype,
          uploadedBy: user.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.status(201).json({ id: newSourceMap.id, message: 'Source map berhasil diunggah' });
    } catch (error) {
      console.error('Error uploading source map from frontend:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengunggah source map' });
    }
  }
);

// Dapatkan semua source map untuk project (perlu auth)
router.get('/api/projects/:projectId/sourcemaps', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { release, active } = req.query;

    // Pastikan user memiliki akses ke project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: (req as any).user.id,
      },
    });

    if (!projectMember) {
      return res.status(403).json({ error: 'Tidak memiliki akses ke project ini' });
    }

    // Query filter
    const where: any = { projectId };
    
    if (release) {
      where.release = release;
    }
    
    if (active === 'true') {
      where.isActive = true;
    } else if (active === 'false') {
      where.isActive = false;
    }

    // Ambil data source map
    const sourceMaps = await prisma.sourceMap.findMany({
      where,
      select: {
        id: true,
        release: true,
        sourceFile: true,
        minifiedFile: true,
        filename: true,
        environment: true,
        originalFiles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: sourceMaps });
  } catch (error) {
    console.error('Error fetching source maps:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data source maps' });
  }
});

// Hapus source map (perlu auth)
router.delete('/api/sourcemaps/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Dapatkan source map
    const sourceMap = await prisma.sourceMap.findUnique({
      where: { id },
      include: {
        Project: true,
      },
    });

    if (!sourceMap) {
      return res.status(404).json({ error: 'Source map tidak ditemukan' });
    }

    // Cek apakah user adalah owner project atau member
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: sourceMap.projectId,
        userId: (req as any).user.id,
      },
    });
    
    // Ambil informasi project untuk cek owner
    const project = await prisma.project.findUnique({
      where: { id: sourceMap.projectId }
    });

    const isOwner = project?.ownerId === (req as any).user.id;

    if (!isOwner && !projectMember) {
      return res.status(403).json({ error: 'Tidak memiliki izin untuk menghapus source map ini' });
    }

    // Hapus source map
    await prisma.sourceMap.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Source map berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting source map:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus source map' });
  }
});

export default router; 