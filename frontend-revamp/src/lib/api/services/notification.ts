import { apiRequest, getAuthToken } from '../core';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

/**
 * Notification API endpoints
 */
export const NotificationAPI = {
  // Ambil semua notifikasi
  getAll: async () => {
    return apiRequest<{ notifications: Notification[] }>('/notifications');
  },
  
  // Ambil jumlah notifikasi yang belum dibaca
  getUnreadCount: async () => {
    return apiRequest<{ count: number }>('/notifications/unread/count');
  },
  
  // Kirim test notification
  sendTest: async () => {
    return apiRequest<{ success: boolean; notification?: Notification }>('/notifications/test', {
      method: 'POST'
    });
  },
  
  // Tandai notifikasi sebagai sudah dibaca
  markAsRead: async (notificationId: string) => {
    return apiRequest<{ success: boolean }>(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },
  
  // Tandai semua notifikasi sebagai sudah dibaca
  markAllAsRead: async () => {
    return apiRequest<{ success: boolean; count: number }>('/notifications/read/all', {
      method: 'PUT'
    });
  },
  
  // Hapus notifikasi
  delete: async (notificationId: string) => {
    return apiRequest<{ success: boolean }>(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  },
  
  // Buat URL untuk koneksi WebSocket notifikasi
  getSocketUrl: () => {
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const token = getAuthToken();
    
    // Pastikan URL tidak memiliki trailing slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Tambahkan query parameter token jika tersedia
    return token ? `${cleanBaseUrl}?token=${token}` : cleanBaseUrl;
  }
}; 