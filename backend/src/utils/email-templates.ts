/**
 * Email Templates
 * Berisi template untuk berbagai jenis email yang dikirim oleh sistem
 * @deprecated Gunakan template dari src/templates/email sebagai gantinya
 */

// Ekspor semua template dari direktori templates/email
export {
  getVerificationEmailTemplate,
  getProjectInviteEmailTemplate,
  getResetPasswordEmailTemplate,
  getWelcomeEmailTemplate,
  getPasswordChangedEmailTemplate
} from '../templates/email'; 