import nodemailer from 'nodemailer';

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
}

export async function sendErrorNotification(to: string, data: ErrorNotificationData) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@lograven.com',
    to,
    subject: `[LogRaven] Error Baru di Project ${data.projectName}`,
    html: `<h3>Error Baru di Project <b>${data.projectName}</b></h3>
      <p><b>Waktu:</b> ${new Date().toLocaleString()}</p>
      <p><b>Tipe Error:</b> ${data.errorType}</p>
      <p><b>Pesan:</b> ${data.message}</p>
      <p><b>Jumlah:</b> ${data.count}</p>
      ${data.url ? `<p><a href="${data.url}">Lihat Detail Error</a></p>` : ''}`
  });
} 