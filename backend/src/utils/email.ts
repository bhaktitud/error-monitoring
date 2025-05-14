import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { getErrorNotificationEmailTemplate } from '../templates/email';
import prisma from '../models/prisma';

// Inisialisasi Resend client dengan mekanisme validasi
let resend: Resend | null = null;
try {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    console.warn('RESEND_API_KEY is not set or empty. Email notifications via Resend will not work.');
  } else {
    resend = new Resend(apiKey);
    console.log('Resend API initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Resend API:', error);
}

// Tetap menyimpan konfigurasi nodemailer untuk fallback jika diperlukan
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ErrorNotificationData {
  projectName: string;
  errorType: string;
  message: string;
  count: number;
  url?: string;
  environment?: string;
  browser?: string;
  os?: string;
  code?: string;
}

export async function sendErrorNotification(to: string, data: ErrorNotificationData) {
  try {
    // Validate inputs
    if (!to || !to.includes('@')) {
      console.error('Invalid recipient email:', to);
      return;
    }
    
    if (!data.projectName || !data.errorType) {
      console.error('Missing required error notification data:', data);
      return;
    }

    // Cari project berdasarkan nama
    const project = await prisma.project.findFirst({
      where: { name: data.projectName }
    });

    if (!project) {
      console.error(`Project not found: ${data.projectName}`);
      return;
    }

    // Cek pengaturan notifikasi
    const notificationSettings = await prisma.projectNotificationSettings.findUnique({
      where: { projectId: project.id }
    });

    // Jika notifikasi email tidak diaktifkan, skip
    if (!notificationSettings?.emailEnabled) {
      console.log(`Email notifications disabled for project: ${data.projectName}`);
      return;
    }

    // Cek level minimum error
    if (notificationSettings.minimumErrorLevel === 'fatal' && data.errorType.toLowerCase() !== 'fatal') {
      console.log(`Error level (${data.errorType}) below minimum threshold (fatal) for project ${data.projectName}`);
      return;
    }

    if (notificationSettings.minimumErrorLevel === 'error' && 
        !['error', 'fatal'].includes(data.errorType.toLowerCase())) {
      console.log(`Error level (${data.errorType}) below minimum threshold (error) for project ${data.projectName}`);
      return;
    }
    
    // Lanjutkan dengan pengiriman email
    const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
    
    // Buat URL detail jika ada
    const detailUrl = data.url || undefined;
    
    // Gunakan template HTML yang sudah dibuat
    const html = getErrorNotificationEmailTemplate({
      ...data,
      detailUrl
    });
    
    // Log email params untuk debug
    console.log('Attempting to send email notification with params:', {
      from: `LogRaven <${fromEmail}>`,
      to: process.env.NODE_ENV === 'production' ? to : 'delivered@resend.dev',
      subject: `[LogRaven] Error Terdeteksi di Project ${data.projectName}`,
      htmlLength: html.length
    });
    
    // Gunakan Resend API jika tersedia
    if (resend) {
      try {
        const { data: emailData, error } = await resend.emails.send({
          from: `LogRaven <${fromEmail}>`,
          to: process.env.NODE_ENV === 'production' ? to : 'delivered@resend.dev',
          subject: `[LogRaven] Error Terdeteksi di Project ${data.projectName}`,
          html
        });
        
        if (error) {
          console.error('Error sending email via Resend:', JSON.stringify(error));
          // Fallback ke nodemailer jika Resend gagal
          await fallbackSendWithNodemailer(to, data);
        } else {
          console.log('Error notification email sent via Resend:', emailData?.id);
        }
      } catch (resendError) {
        console.error('Exception in Resend API call:', resendError);
        // Fallback ke nodemailer jika terjadi exception
        await fallbackSendWithNodemailer(to, data);
      }
    } else {
      console.warn('Resend API not initialized. Using nodemailer fallback.');
      await fallbackSendWithNodemailer(to, data);
    }
  } catch (err) {
    console.error('Failed to send error notification email:', err);
    try {
      // Fallback ke nodemailer jika terjadi exception
      await fallbackSendWithNodemailer(to, data);
    } catch (finalError) {
      console.error('All email delivery methods failed:', finalError);
    }
  }
}

// Fungsi fallback menggunakan nodemailer
async function fallbackSendWithNodemailer(to: string, data: ErrorNotificationData) {
  try {
    // Validasi konfigurasi SMTP sebelum mencoba mengirim
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP configuration is incomplete. Cannot send email via nodemailer.');
      return;
    }
    
    console.log('Attempting to send email via nodemailer fallback to:', to);
    
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lograven.com',
      to: process.env.NODE_ENV === 'production' ? to : 'delivered@resend.dev',
      subject: `[LogRaven] Error Baru di Project ${data.projectName}`,
      html: `<h3>Error Baru di Project <b>${data.projectName}</b></h3>
        <p><b>Waktu:</b> ${new Date().toLocaleString()}</p>
        <p><b>Tipe Error:</b> ${data.errorType}</p>
        <p><b>Pesan:</b> ${data.message}</p>
        <p><b>Jumlah:</b> ${data.count}</p>
        ${data.url ? `<p><a href="${data.url}">Lihat Detail Error</a></p>` : ''}`
    });
    
    console.log('Error notification email sent via nodemailer fallback:', result.messageId);
  } catch (fallbackErr) {
    console.error('Fallback email sending also failed:', fallbackErr);
  }
} 