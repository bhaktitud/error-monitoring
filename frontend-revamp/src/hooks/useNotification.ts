import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface UseNotificationOptions {
  socketUrl?: string;
  autoConnect?: boolean;
}

/**
 * Hook untuk mengelola notifikasi dengan Socket.IO
 */
export function useNotification({ 
  socketUrl = 'http://localhost:3000',
  autoConnect = true 
}: UseNotificationOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Menggunakan useSocket hook
  const { 
    isConnected, 
    error: socketError, 
    on, 
    emit 
  } = useSocket({
    url: socketUrl,
    autoConnect
  });

  // Fetch notifications dari API
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   sessionStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${socketUrl}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        console.warn('Invalid notifications data format:', data);
        setNotifications([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [socketUrl]);

  // Fetch unread count dari API
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   sessionStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const response = await fetch(`${socketUrl}/api/notifications/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.status}`);
      }

      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [socketUrl]);

  // Kirim test notification
  const sendTestNotification = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   sessionStorage.getItem('token');
                   
      if (!token) {
        setError('No authentication token found');
        return false;
      }
      
      const response = await fetch(`${socketUrl}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error sending test notification: ${response.status} ${errorText}`);
      }
      
      return true;
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  }, [socketUrl]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   sessionStorage.getItem('token');
                   
      if (!token) {
        return false;
      }
      
      const response = await fetch(`${socketUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [socketUrl]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   sessionStorage.getItem('token');
                   
      if (!token) {
        return false;
      }
      
      const response = await fetch(`${socketUrl}/api/notifications/read/all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`);
      }
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [socketUrl]);
  
  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   sessionStorage.getItem('token');
                   
      if (!token) {
        return false;
      }
      
      const response = await fetch(`${socketUrl}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }
      
      // Check if notification was unread before deleting
      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
      
      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [socketUrl, notifications]);

  // Setup listeners when socket connection is established
  useEffect(() => {
    if (isConnected) {
      const removeNotificationListener = on<Notification>('notification', (notification) => {
        console.log('Received notification:', notification);
        setNotifications(prev => [notification, ...prev]);
        if (!notification.read) {
          setUnreadCount(prev => prev + 1);
        }
      });
      
      // Initial data load on connect
      fetchNotifications();
      fetchUnreadCount();
      
      return () => {
        removeNotificationListener();
      };
    }
  }, [isConnected, on, fetchNotifications, fetchUnreadCount]);

  // Update error state when socket error changes
  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  // Heartbeat mechanism to ensure connection is alive
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      emit('heartbeat');
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isConnected, emit]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    sendTestNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
    refreshUnreadCount: fetchUnreadCount
  };
} 