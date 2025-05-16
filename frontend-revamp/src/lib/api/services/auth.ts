import { apiRequest } from '../core';

/**
 * Auth API endpoints
 */
export const AuthAPI = {
  // Login user
  login: async (email: string, password: string) => {
    return apiRequest<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Register user
  register: async (email: string, password: string, inviteToken?: string | null) => {
    const payload = inviteToken 
      ? { email, password, inviteToken } 
      : { email, password };
      
    return apiRequest<{ id: string; email: string; verificationEmailSent: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Verify email
  verifyEmail: async (token: string) => {
    return apiRequest<{ success: boolean; message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Resend verification email
  resendVerification: async (email: string) => {
    return apiRequest<{ success: boolean; message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Request password reset (forgot password)
  forgotPassword: async (email: string) => {
    return apiRequest<{ success: boolean; message: string; needVerification?: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    return apiRequest<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
}; 