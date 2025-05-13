import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onConnectCallback?: () => void;
  onDisconnectCallback?: () => void;
}

/**
 * Hook untuk mengelola koneksi Socket.IO
 */
export function useSocket({
  url = 'http://localhost:3000',
  autoConnect = true,
  onConnectCallback,
  onDisconnectCallback
}: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mendapatkan token
  const getToken = useCallback(() => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           sessionStorage.getItem('token') ||
           '';
  }, []);

  // Fungsi untuk membuat koneksi socket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Socket already connected, reusing connection');
      setIsConnected(true);
      return socketRef.current;
    }

    // Cleanup koneksi lama jika ada
    if (socketRef.current) {
      console.log('Cleaning up existing socket connection');
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }

    const token = getToken();
    if (!token) {
      setError('No authentication token found');
      return null;
    }

    try {
      console.log('Connecting to socket server at:', url);
      
      // Buat koneksi socket dengan konfigurasi minimal
      const socket = io(url, {
        auth: { 
          token,
          Authorization: `Bearer ${token}`
        },
        extraHeaders: {
          'Authorization': `Bearer ${token}`
        },
        reconnectionAttempts: 3,
        reconnectionDelay: 10000,
      });

      // Event handlers
      socket.on('connect', () => {
        console.log('Socket connected successfully:', socket.id);
        setIsConnected(true);
        setError(null);
        if (onConnectCallback) onConnectCallback();
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setIsConnected(false);
        setError(err.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason);
        setIsConnected(false);
        if (onDisconnectCallback) onDisconnectCallback();
      });

      socketRef.current = socket;
      return socket;
    } catch (err) {
      console.error('Error creating socket connection:', err);
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [url, getToken, onConnectCallback, onDisconnectCallback]);

  // Fungsi untuk memutuskan koneksi
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting socket');
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Fungsi untuk mendengarkan event
  const on = useCallback(<T = unknown>(event: string, callback: (data: T) => void) => {
    if (!socketRef.current) {
      console.warn('Socket not connected, cannot add listener for event:', event);
      return () => {}; // Cleanup function
    }
    
    socketRef.current.on(event, callback);
    
    // Return cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  // Fungsi untuk mengirim event
  const emit = useCallback(<T = unknown>(event: string, data?: T) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return false;
    }
    
    if (data !== undefined) {
      socketRef.current.emit(event, data);
    } else {
      socketRef.current.emit(event);
    }
    return true;
  }, [isConnected]);

  // Auto-connect pada mount jika diperlukan
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup pada unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Reconnect jika token berubah
  useEffect(() => {
    const token = getToken();
    
    if (token && socketRef.current && !socketRef.current.connected) {
      connect();
    }
  }, [getToken, connect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
    on,
    emit
  };
} 