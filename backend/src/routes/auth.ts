import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../models/prisma';
import { auth } from './project';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Resend } from 'resend';

const router = express.Router();

// Inisialisasi Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Konfigurasi multer untuk upload avatar
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan!'));
    }
  }
});

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.passwordHash) {
        // Sudah pernah register manual
        return res.status(409).json({ error: 'Email sudah terdaftar' });
      } else {
        // User dummy (invite), update password
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({ where: { email }, data: { passwordHash } });
        return res.status(201).json({ email });
      }
    }
    
    // Import fungsi token
    const { generateToken, getVerificationTokenExpiry } = require('../utils/token');
    // Import template email
    const { getVerificationEmailTemplate } = require('../utils/email-templates');
    
    // Buat token verifikasi
    const verificationToken = generateToken();
    const verificationTokenExpiry = getVerificationTokenExpiry();
    
    // User baru
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ 
      data: { 
        email, 
        passwordHash,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry
      } 
    });
    
    // Buat link verifikasi
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    // Buat konten email
    const userName = email.split('@')[0];
    const emailHtml = getVerificationEmailTemplate(userName, verificationLink);
    
    // Kirim email verifikasi
    try {
      const { data, error } = await resend.emails.send({
        from: 'Error Monitoring <onboarding@resend.dev>',
        to: process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev',
        subject: 'Verifikasi Email Anda',
        html: emailHtml
      });
      
      if (error) {
        console.error('Error sending verification email:', error);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Tetap lanjutkan meskipun email gagal terkirim
    }
    
    res.status(201).json({ 
      id: user.id, 
      email: user.email,
      verificationEmailSent: true
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Gagal register' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email tidak ditemukan' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Password salah' });
    
    // Cek apakah email sudah diverifikasi
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Email belum diverifikasi',
        needVerification: true,
        email: user.email
      });
    }
    
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi error pada server' });
  }
});

// Get current user info
router.get('/me', auth, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { 
        id: true, 
        email: true,
        name: true,
        phoneNumber: true,
        avatar: true,
        timezone: true,
        language: true,
        jobTitle: true,
        department: true,
        githubUsername: true,
        createdAt: true,
        notifyEmail: true,
        notifyInApp: true,
        notifySms: true,
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    
    // Menyusun data respons yang sesuai dengan format yang diharapkan frontend
    const response = {
      ...user,
      joinedAt: user.createdAt,
      notificationPreferences: {
        email: user.notifyEmail,
        inApp: user.notifyInApp,
        sms: user.notifySms
      }
    };
    
    // Hapus properti yang tidak dibutuhkan di respons
    delete (response as any).createdAt;
    delete (response as any).notifyEmail;
    delete (response as any).notifyInApp;
    delete (response as any).notifySms;
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi error pada server' });
  }
});

// Update user profile
router.patch('/profile', auth, async (req: any, res) => {
  try {
    const { 
      name, 
      phoneNumber, 
      timezone, 
      language, 
      jobTitle, 
      department, 
      githubUsername,
      notificationPreferences
    } = req.body;
    
    // Persiapkan data yang akan diupdate
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (language !== undefined) updateData.language = language;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (department !== undefined) updateData.department = department;
    if (githubUsername !== undefined) updateData.githubUsername = githubUsername;
    
    // Update preferensi notifikasi jika ada
    if (notificationPreferences) {
      if (notificationPreferences.email !== undefined) updateData.notifyEmail = notificationPreferences.email;
      if (notificationPreferences.inApp !== undefined) updateData.notifyInApp = notificationPreferences.inApp;
      if (notificationPreferences.sms !== undefined) updateData.notifySms = notificationPreferences.sms;
    }
    
    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: { 
        id: true, 
        email: true,
        name: true,
        phoneNumber: true,
        avatar: true,
        timezone: true,
        language: true,
        jobTitle: true,
        department: true,
        githubUsername: true,
        createdAt: true,
        notifyEmail: true,
        notifyInApp: true,
        notifySms: true,
      }
    });
    
    // Format response
    const response = {
      ...updatedUser,
      joinedAt: updatedUser.createdAt,
      notificationPreferences: {
        email: updatedUser.notifyEmail,
        inApp: updatedUser.notifyInApp,
        sms: updatedUser.notifySms
      }
    };
    
    // Hapus properti yang tidak dibutuhkan di respons
    delete (response as any).createdAt;
    delete (response as any).notifyEmail;
    delete (response as any).notifyInApp;
    delete (response as any).notifySms;
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi error pada server' });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }
    
    // Dapatkan path relatif untuk akses file
    const relativePath = `/uploads/avatars/${path.basename(req.file.path)}`;
    
    // Update avatar di database
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar: relativePath }
    });
    
    res.json({ 
      success: true, 
      avatarUrl: relativePath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupload avatar' });
  }
});

// Update password
router.put('/password', auth, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password saat ini dan password baru harus diisi' });
    }
    
    // Cek minimal panjang password
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password baru minimal 8 karakter' });
    }
    
    // Ambil user dari database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { passwordHash: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    
    // Verifikasi password lama
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Password saat ini salah' });
    }
    
    // Hash password baru
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password di database
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newPasswordHash }
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui password' });
  }
});

// Test send email to current user
router.post('/test-email', auth, async (req: any, res) => {
  try {
    // Ambil data user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { 
        email: true,
        name: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    
    // Buat konten email
    const userName = user.name || user.email.split('@')[0];
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Profil Pengguna Berhasil Diperbarui</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
          <p>Halo ${userName},</p>
          
          <p>Ini adalah email test dari sistem. Email ini menunjukkan bahwa sistem notifikasi email berfungsi dengan baik.</p>
          
          <p>Anda menerima email ini karena Anda telah menggunakan fitur "Test Email" di aplikasi kami.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Informasi Penting:</p>
            <p style="margin: 10px 0 0;">Email ini hanya untuk tujuan pengujian. Tidak diperlukan tindakan lebih lanjut.</p>
          </div>
          
          <p>Terima kasih telah menggunakan aplikasi kami.</p>
          
          <p>Salam,<br>Tim Support</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Email ini dikirim secara otomatis. Mohon jangan membalas.</p>
          <p>&copy; ${new Date().getFullYear()} Error Monitoring System. All rights reserved.</p>
        </div>
      </div>
    `;
    
    // Kirim email menggunakan Resend
    const { data, error } = await resend.emails.send({
      from: 'Error Monitoring <onboarding@resend.dev>',
      to: "delivered@resend.dev", /* for testing we used delivered@resend.dev , later in production we will use user.email,*/
      subject: 'Test Email dari Error Monitoring System',
      html: html
    });
    
    if (error) {
      throw new Error(`Error dari Resend: ${error.message}`);
    }
    
    res.json({ 
      success: true, 
      message: `Email test berhasil dikirim ke ${user.email}`,
      id: data?.id
    });
  } catch (err: any) {
    console.error('Error sending test email:', err);
    res.status(500).json({ error: `Gagal mengirim email test: ${err.message}` });
  }
});

// Verifikasi email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'Token verifikasi tidak ditemukan' });
  }
  
  try {
    // Import fungsi token
    const { isTokenValid } = require('../utils/token');
    // Import template email
    const { getWelcomeEmailTemplate } = require('../utils/email-templates');
    
    // Cari user dengan token verifikasi yang sesuai
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token as string
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Token verifikasi tidak valid' });
    }
    
    // Cek apakah token sudah kadaluarsa
    if (!isTokenValid(user.verificationTokenExpiry)) {
      return res.status(400).json({ error: 'Token verifikasi sudah kadaluarsa' });
    }
    
    // Update user menjadi terverifikasi
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      }
    });
    
    // Kirim email selamat datang
    try {
      const userName = user.name || user.email.split('@')[0];
      const emailHtml = getWelcomeEmailTemplate(userName);
      
      const { data, error } = await resend.emails.send({
        from: 'Error Monitoring <onboarding@resend.dev>',
        to: process.env.NODE_ENV === 'production' ? user.email : 'delivered@resend.dev',
        subject: 'Selamat Datang di Error Monitoring',
        html: emailHtml
      });
      
      if (error) {
        console.error('Error sending welcome email:', error);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Tetap lanjutkan meskipun email gagal terkirim
    }
    
    // Redirect ke halaman sukses di frontend
    res.redirect(`${process.env.FRONTEND_URL}/verify-success`);
  } catch (err) {
    console.error('Error verifying email:', err);
    res.status(500).json({ error: 'Gagal memverifikasi email' });
  }
});

// Endpoint untuk resend verifikasi email
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi' });
  }
  
  try {
    // Import fungsi token
    const { generateToken, getVerificationTokenExpiry } = require('../utils/token');
    // Import template email
    const { getVerificationEmailTemplate } = require('../utils/email-templates');
    
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      // Untuk keamanan, kita tidak memberi tahu bahwa user tidak ditemukan
      return res.status(200).json({ message: 'Jika email terdaftar, email verifikasi akan dikirim' });
    }
    
    // Jika user sudah terverifikasi
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email sudah terverifikasi' });
    }
    
    // Buat token verifikasi baru
    const verificationToken = generateToken();
    const verificationTokenExpiry = getVerificationTokenExpiry();
    
    // Update token verifikasi user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry
      }
    });
    
    // Buat link verifikasi
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    // Buat konten email
    const userName = user.name || user.email.split('@')[0];
    const emailHtml = getVerificationEmailTemplate(userName, verificationLink);
    
    // Kirim email verifikasi
    const { data, error } = await resend.emails.send({
      from: 'Error Monitoring <onboarding@resend.dev>',
      to: process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev',
      subject: 'Verifikasi Email Anda',
      html: emailHtml
    });
    
    if (error) {
      throw new Error(`Error dari Resend: ${error.message}`);
    }
    
    res.status(200).json({ 
      message: 'Email verifikasi telah dikirim ulang',
      success: true 
    });
  } catch (err) {
    console.error('Error resending verification email:', err);
    res.status(500).json({ error: 'Gagal mengirim ulang email verifikasi' });
  }
});

export default router; 