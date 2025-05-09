// Script untuk membuat akun dummy untuk testing undangan
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDummyUser() {
  try {
    // Email yang akan digunakan untuk testing
    const email = 'tester@example.com';
    
    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`User dengan email ${email} sudah ada!`);
      console.log(`Email: ${email}`);
      console.log(`Password: testing123`);
      console.log(`User ID: ${existingUser.id}`);
      return;
    }
    
    // Buat password hash
    const passwordHash = await bcrypt.hash('testing123', 10);
    
    // Buat user baru
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: true // Set true agar bisa langsung login
      }
    });
    
    console.log(`User dummy berhasil dibuat:`);
    console.log(`Email: ${email}`);
    console.log(`Password: testing123`);
    console.log(`User ID: ${user.id}`);
    
  } catch (error) {
    console.error('Error membuat user dummy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan fungsi
createDummyUser(); 