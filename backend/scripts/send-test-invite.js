// Script untuk mengirim undangan testing
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Set NODE_ENV ke development untuk melewati pengecekan email
process.env.NODE_ENV = 'development';
process.env.RESEND_API_KEY = '';  // Kosongkan API key untuk melewati pengiriman email

const prisma = new PrismaClient();

// Generate JWT token untuk admin user
function generateAdminToken(userId) {
  return jwt.sign(
    { userId, email: 'admin@example.com' },
    process.env.JWT_SECRET || 'development-secret',
    { expiresIn: '1h' }
  );
}

async function sendTestInvitation() {
  try {
    // Cari project pertama untuk digunakan
    const project = await prisma.project.findFirst();
    
    if (!project) {
      console.log('Tidak ada project yang ditemukan!');
      return;
    }
    
    // Cari atau buat user admin
    let adminUser = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    });
    
    if (!adminUser) {
      console.log('Membuat user admin...');
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          passwordHash: 'dummy',
          emailVerified: true
        }
      });
    }
    
    // Pastikan admin user adalah member dari project
    let adminMember = await prisma.projectMember.findFirst({
      where: { 
        projectId: project.id,
        userId: adminUser.id 
      }
    });
    
    if (!adminMember) {
      console.log('Menambahkan admin sebagai member project...');
      adminMember = await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: adminUser.id,
          role: 'admin'
        }
      });
    }
    
    // Generate token untuk admin user
    const token = generateAdminToken(adminUser.id);
    
    // Email untuk undangan testing
    const testEmail = 'tester@example.com';
    
    // Kirim undangan via API
    const response = await axios.post(
      `http://localhost:3000/api/projects/${project.id}/members/invite`,
      { email: testEmail, role: 'member' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Berhasil mengirim undangan:');
    console.log(response.data);
    console.log('\nGunakan link berikut untuk testing:');
    console.log(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/invite?token=${response.data.invite.token}&projectId=${project.id}&email=${encodeURIComponent(testEmail)}`);
    
  } catch (error) {
    console.error('Error mengirim undangan:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

sendTestInvitation(); 