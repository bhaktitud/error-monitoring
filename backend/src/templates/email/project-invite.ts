/**
 * Template email untuk undangan project
 */
export const getProjectInviteEmailTemplate = (userName: string, inviterName: string, projectName: string, role: string, inviteLink: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0B2447; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Undangan Project</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
        <p>Halo ${userName},</p>
        
        <p>Anda telah diundang oleh <strong>${inviterName}</strong> untuk bergabung dengan project <strong>${projectName}</strong> sebagai <strong>${role}</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #0B2447; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Terima Undangan
          </a>
        </div>
        
        <p>Atau, Anda dapat menyalin dan menempelkan URL berikut ke browser Anda:</p>
        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
          ${inviteLink}
        </p>
        
        <p>Link ini akan kedaluwarsa dalam 24 jam. Jika Anda tidak mengenal pengirim undangan ini, silakan abaikan email ini.</p>
        
        <p>Terima kasih,<br>Tim LogRaven</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Email ini dikirim secara otomatis. Mohon jangan membalas.</p>
        <p>&copy; ${new Date().getFullYear()} LogRaven. All rights reserved.</p>
      </div>
    </div>
  `;
}; 