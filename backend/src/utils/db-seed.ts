import prisma from '../models/prisma';
import bcrypt from 'bcrypt';
import { generateToken, getVerificationTokenExpiry } from './token';

/**
 * Fungsi untuk mengisi database dengan data testing
 * Berguna untuk pengujian dan development
 */
async function seedDatabase() {
  console.log('🌱 Mengisi database dengan data testing...');
  
  try {
    // Buat user admin untuk testing
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash,
        name: 'Admin User',
        emailVerified: true,
        notifyEmail: true,
        notifyInApp: true
      }
    });
    console.log('✅ Admin user dibuat:', adminUser.email);
    
    // Buat user biasa untuk testing
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash,
        name: 'Regular User',
        emailVerified: true
      }
    });
    console.log('✅ Regular user dibuat:', regularUser.email);
    
    // Buat user yang belum diverifikasi
    const verificationToken = generateToken();
    const unverifiedUser = await prisma.user.create({
      data: {
        email: 'unverified@example.com',
        passwordHash,
        name: 'Unverified User',
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry: getVerificationTokenExpiry()
      }
    });
    console.log('✅ Unverified user dibuat:', unverifiedUser.email);
    console.log(`   Token verifikasi: ${verificationToken}`);
    
    // Buat project untuk admin
    const adminProject = await prisma.project.create({
      data: {
        name: 'Admin Project',
        ownerId: adminUser.id,
        dsn: 'https://admindsn1234567890@error-monitor.com/1'
      }
    });
    console.log('✅ Project untuk admin dibuat:', adminProject.name);
    
    // Buat project untuk regular user
    const userProject = await prisma.project.create({
      data: {
        name: 'User Project',
        ownerId: regularUser.id,
        dsn: 'https://userdsn1234567890@error-monitor.com/2'
      }
    });
    console.log('✅ Project untuk regular user dibuat:', userProject.name);
    
    // Tambahkan admin sebagai member di project regular user
    const projectMember = await prisma.projectMember.create({
      data: {
        projectId: userProject.id,
        userId: adminUser.id,
        role: 'admin'
      }
    });
    console.log('✅ Admin ditambahkan sebagai member di User Project');
    
    // Buat error group untuk admin project
    const adminErrorGroup = await prisma.errorGroup.create({
      data: {
        projectId: adminProject.id,
        fingerprint: 'error-fingerprint-admin-1',
        errorType: 'TypeError',
        message: 'Cannot read property of undefined',
        status: 'open',
        count: 5,
        firstSeen: new Date(Date.now() - 86400000), // 1 hari yang lalu
        lastSeen: new Date(),
        statusCode: 500
      }
    });
    console.log('✅ Error group untuk admin project dibuat');
    
    // Buat event untuk error group admin
    await prisma.event.create({
      data: {
        projectId: adminProject.id,
        groupId: adminErrorGroup.id,
        errorType: 'TypeError',
        message: 'Cannot read property of undefined',
        stacktrace: 'Error: Cannot read property of undefined\n   at Object.<anonymous> (/app/src/components/Dashboard.js:15:10)\n   at Module._compile (internal/modules/cjs/loader.js:1085:14)',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        statusCode: 500,
        userContext: {
          userId: '123',
          username: 'testuser',
          email: 'testuser@example.com'
        },
        tags: {
          environment: 'production',
          version: '1.0.0'
        }
      }
    });
    console.log('✅ Event untuk admin error group dibuat');
    
    // Buat webhook untuk admin project
    await prisma.webhook.create({
      data: {
        projectId: adminProject.id,
        url: 'https://webhook.site/example-webhook',
        enabled: true,
        eventType: 'error',
        secret: 'webhook-secret-123'
      }
    });
    console.log('✅ Webhook untuk admin project dibuat');
    
    console.log('🎉 Database berhasil diisi dengan data testing!');
  } catch (error) {
    console.error('❌ Gagal mengisi database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Jika file ini dijalankan langsung (bukan diimpor)
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default seedDatabase; 