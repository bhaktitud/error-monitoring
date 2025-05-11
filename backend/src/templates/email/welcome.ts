/**
 * Template email selamat datang setelah verifikasi berhasil
 */
export const getWelcomeEmailTemplate = (userName: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B2447; color: white; padding: 20px; text-align: center;">
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
        
        <p>Terima kasih,<br>Tim LogRaven</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Email ini dikirim secara otomatis. Mohon jangan membalas.</p>
        <p>&copy; ${new Date().getFullYear()} LogRaven. All rights reserved.</p>
      </div>
    </div>
  `;
}; 