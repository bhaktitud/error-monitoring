/**
 * Email Templates
 * Berisi template untuk berbagai jenis email yang dikirim oleh sistem
 */

// Template untuk email verifikasi
export const getVerificationEmailTemplate = (userName: string, verificationLink: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Verifikasi Email Anda</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
        <p>Halo ${userName},</p>
        
        <p>Terima kasih telah mendaftar. Untuk melanjutkan proses pendaftaran, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verifikasi Email
          </a>
        </div>
        
        <p>Atau, Anda dapat menyalin dan menempelkan URL berikut ke browser Anda:</p>
        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
          ${verificationLink}
        </p>
        
        <p>Link ini akan kedaluwarsa dalam 24 jam. Jika Anda tidak membuat akun ini, silakan abaikan email ini.</p>
        
        <p>Terima kasih,<br>Tim Error Monitoring</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Email ini dikirim secara otomatis. Mohon jangan membalas.</p>
        <p>&copy; ${new Date().getFullYear()} Error Monitoring System. All rights reserved.</p>
      </div>
    </div>
  `;
};

// Template untuk email reset password
export const getResetPasswordEmailTemplate = (userName: string, resetLink: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Reset Password Anda</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
        <p>Halo ${userName},</p>
        
        <p>Kami menerima permintaan untuk mereset password akun Anda. Untuk melanjutkan proses reset password, silakan klik tombol di bawah ini:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>Atau, Anda dapat menyalin dan menempelkan URL berikut ke browser Anda:</p>
        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
          ${resetLink}
        </p>
        
        <p>Link ini akan kedaluwarsa dalam 1 jam. Jika Anda tidak meminta reset password, silakan abaikan email ini.</p>
        
        <p>Terima kasih,<br>Tim Error Monitoring</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Email ini dikirim secara otomatis. Mohon jangan membalas.</p>
        <p>&copy; ${new Date().getFullYear()} Error Monitoring System. All rights reserved.</p>
      </div>
    </div>
  `;
};

// Template untuk email konfirmasi setelah verifikasi berhasil
export const getWelcomeEmailTemplate = (userName: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Selamat Datang!</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
        <p>Halo ${userName},</p>
        
        <p>Selamat! Email Anda telah berhasil diverifikasi dan akun Anda sekarang aktif.</p>
        
        <p>Dengan akun ini, Anda dapat:</p>
        <ul>
          <li>Membuat dan mengelola proyek</li>
          <li>Melacak error dan exceptions</li>
          <li>Mengatur notifikasi</li>
          <li>Berkolaborasi dengan tim Anda</li>
        </ul>
        
        <p>Jika Anda memiliki pertanyaan atau membutuhkan bantuan, jangan ragu untuk menghubungi tim dukungan kami.</p>
        
        <p>Terima kasih,<br>Tim Error Monitoring</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Email ini dikirim secara otomatis. Mohon jangan membalas.</p>
        <p>&copy; ${new Date().getFullYear()} Error Monitoring System. All rights reserved.</p>
      </div>
    </div>
  `;
};

// Template untuk email konfirmasi setelah password berhasil direset
export const getPasswordChangedEmailTemplate = (userName: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Password Berhasil Diubah</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
        <p>Halo ${userName},</p>
        
        <p>Password akun Anda telah berhasil diubah.</p>
        
        <p>Jika Anda tidak melakukan perubahan ini, segera hubungi tim dukungan kami.</p>
        
        <p>Terima kasih,<br>Tim Error Monitoring</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Email ini dikirim secara otomatis. Mohon jangan membalas.</p>
        <p>&copy; ${new Date().getFullYear()} Error Monitoring System. All rights reserved.</p>
      </div>
    </div>
  `;
}; 