import { apiRequest } from '../core';
import type { UserContext, Tags, Event } from './types';
import { createQueryString } from '@/lib/utils/url';

/**
 * Event API endpoints
 */
export const EventAPI = {
  // Ambil event berdasarkan ID
  getEventById: async (projectId: string, eventId: string) => {
    return apiRequest<Event>(`/projects/${projectId}/events/${eventId}`);
  },
  
  // Ambil daftar event terbaru
  getEvents: async (projectId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    errorType?: string;
    environment?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const url = `/events/project/${projectId}${createQueryString(params)}`;
    return apiRequest<{ events: Event[]; total: number; page: number; pages: number }>(url);
  },
  
  // Kirim event error baru
  sendEvent: async (projectId: string, data: {
    errorType: string;
    message: string;
    stacktrace?: string;
    userContext?: UserContext;
    tags?: Tags;
    environment?: string;
    release?: string;
    statusCode?: number;
  }) => {
    return apiRequest<{ id: string; message: string }>(`/projects/${projectId}/events`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // Ambil statistik event
  getStats: async (projectId: string, params?: {
    period?: 'day' | 'week' | 'month';
    startDate?: string;
    endDate?: string;
    errorType?: string;
    environment?: string;
  }) => {
    const url = `/projects/${projectId}/stats${createQueryString(params)}`;
    return apiRequest<{
      total: number;
      byDay: Array<{ date: string; count: number }>;
      byErrorType: Array<{ errorType: string; count: number }>;
      byBrowser: Array<{ browser: string; count: number }>;
      byOS: Array<{ os: string; count: number }>;
    }>(url);
  }
}; 