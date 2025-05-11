/**
 * Template email untuk verifikasi akun
 */
export const getVerificationEmailTemplate = (userName: string, verificationLink: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B2447; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Verifikasi Email Anda</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
        <p>Halo ${userName},</p>
        
        <p>Terima kasih telah mendaftar. Untuk melanjutkan proses pendaftaran, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #0B2447; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verifikasi Email
          </a>
        </div>
        
        <p>Atau, Anda dapat menyalin dan menempelkan URL berikut ke browser Anda:</p>
        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
          ${verificationLink}
        </p>
        
        <p>Link ini akan kedaluwarsa dalam 24 jam. Jika Anda tidak membuat akun ini, silakan abaikan email ini.</p>
        
        <p>Terima kasih,<br>Tim LogRaven</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Email ini dikirim secara otomatis. Mohon jangan membalas.</p>
        <p>&copy; ${new Date().getFullYear()} LogRaven. All rights reserved.</p>
      </div>
    </div>
  `;
}; 