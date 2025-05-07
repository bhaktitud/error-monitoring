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

export async function sendErrorNotification(to: string, projectName: string, errorMessage: string, errorType: string, timestamp: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@sentry-clone.com',
    to,
    subject: `[Sentry Clone] Error Baru di Project ${projectName}`,
    html: `<h3>Error Baru di Project <b>${projectName}</b></h3>
      <p><b>Waktu:</b> ${timestamp}</p>
      <p><b>Tipe Error:</b> ${errorType}</p>
      <p><b>Pesan:</b> ${errorMessage}</p>`
  });
} 