// Base URL untuk API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Interface untuk user context dan tags
interface UserContext {
  userId?: string;
  [key: string]: unknown;
}

interface Tags {
  version?: string;
  [key: string]: unknown;
}

// Interface untuk user profile yang lengkap
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
  jobTitle?: string;
  department?: string;
  joinedAt?: string;
  githubUsername?: string;
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  plan?: {
    name: string;
    features: Record<string, any>;
  };
}

/**
 * Fungsi utility untuk melakukan request ke API
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Ambil token dari localStorage (client-side)
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Parse error response
      const errorData = await response.json().catch(() => ({
        error: 'Terjadi kesalahan server'
      }));
      throw new Error(errorData.error || 'Terjadi kesalahan pada server');
    }
    
    // Parse response sebagai JSON
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

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

  // Get current user profile
  getCurrentUser: async () => {
    return apiRequest<UserProfile>('/auth/me');
  },
  
  // Update user profile
  updateProfile: async (profileData: Partial<UserProfile>) => {
    return apiRequest<UserProfile>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  },
  
  // Update user password
  updatePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<{ success: boolean }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  
  // Upload avatar menggunakan ImageKit
  uploadAvatar: async (file: File) => {
    try {
      // 1. Dapatkan authentication parameters dari backend dengan apiRequest
      const { token, expire, signature } = await apiRequest<{ token: string; expire: number; signature: string }>('/media/auth');

      // 2. Upload file ke ImageKit (fetch langsung, bukan apiRequest)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('token', token);
      formData.append('expire', expire.toString());
      formData.append('signature', signature);
      formData.append('folder', '/avatars');
      formData.append('useUniqueFileName', 'true');
      formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '');

      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Gagal mengupload avatar');
      }

      const result = await response.json();

      console.log(result, 'result');

      // 3. Update profil user dengan URL avatar baru
      await AuthAPI.updateProfile({
        avatar: result.url
      });

      return {
        success: true,
        avatarUrl: result.url
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },
  
  // Send test email
  sendTestEmail: async () => {
    return apiRequest<{ success: boolean; message: string }>('/auth/test-email', {
      method: 'POST',
    });
  },
};

/**
 * Projects API endpoints
 */
export const ProjectsAPI = {
  // Get all projects for current user
  getProjects: async () => {
    return apiRequest<{ ownedProjects: Array<{ id: string; name: string; dsn: string; createdAt: string; }>, invitedProjects: Array<{ id: string; name: string; dsn: string; createdAt: string; }> }>('/projects');
  },

  // Get single project by ID
  getProject: async (projectId: string) => {
    const { ownedProjects, invitedProjects } = await apiRequest<{ ownedProjects: Array<{ id: string; name: string; dsn: string; createdAt: string; }>, invitedProjects: Array<{ id: string; name: string; dsn: string; createdAt: string; }> }>('/projects');
    const project = [...ownedProjects, ...invitedProjects].find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  },

  // Create a new project
  createProject: async (name: string) => {
    return apiRequest<{
      id: string;
      name: string;
      dsn: string;
    }>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // Get project members
  getProjectMembers: async (projectId: string) => {
    return apiRequest<Array<{
      id: string;
      role: string;
      user: {
        id: string;
        email: string;
      }
    }>>(`/projects/${projectId}/members`);
  },

  // Invite member to project
  inviteMember: async (projectId: string, email: string, role: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      invite: {
        id: string;
        email: string;
        role: string;
        expiresAt: string;
      }
    }>(`/projects/${projectId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },

  // Accept project invitation
  acceptInvite: async (token: string, projectId: string, email: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      projectId: string;
      projectName: string;
      role: string;
    }>(`/projects/accept-invite`, {
      method: 'POST',
      body: JSON.stringify({ token, projectId, email }),
    });
  },
  
  // Get pending invitations for a project
  getInvitations: async (projectId: string) => {
    return apiRequest<Array<{
      id: string;
      email: string;
      role: string;
      createdAt: string;
      expiresAt: string;
      status: string;
      inviter: {
        email: string;
        name: string;
      }
    }>>(`/projects/${projectId}/invites`);
  },
  
  // Cancel invitation
  cancelInvitation: async (projectId: string, inviteId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/projects/${projectId}/invites/${inviteId}`, {
      method: 'DELETE',
    });
  },
  
  // Resend invitation
  resendInvitation: async (projectId: string, inviteId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      invite: {
        id: string;
        email: string;
        role: string;
        expiresAt: string;
      }
    }>(`/projects/${projectId}/invites/${inviteId}/resend`, {
      method: 'POST',
    });
  },

  // Change member role
  changeMemberRole: async (projectId: string, memberId: string, role: string) => {
    return apiRequest<{
      id: string;
      role: string;
      user: {
        id: string;
        email: string;
      }
    }>(`/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  // Remove member from project
  removeMember: async (projectId: string, memberId: string) => {
    return apiRequest<{ success: boolean }>(`/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  // Delete project
  deleteProject: async (projectId: string) => {
    return apiRequest<{ success: boolean; message?: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  // Update project settings
  updateProject: async (projectId: string, settings: Record<string, any>) => {
    return apiRequest<{ success: boolean; message?: string; project?: any }>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
};

/**
 * Error Events API endpoints
 */
export const EventsAPI = {
  // Get events for a project
  getEvents: async (projectId: string) => {
    return apiRequest<Array<{
      id: string;
      errorType: string;
      message: string;
      timestamp: string;
      stacktrace: string;
      userAgent: string;
      statusCode: number;
      userContext: UserContext;
      tags: Tags;
    }>>(`/events/project/${projectId}`);
  },
  
  // Get events usage and quota
  getEventsUsage: async (projectId: string) => {
    return apiRequest<{
      totalEvents: number;
      quota: number;
      percent: number;
    }>(`/events/usage/${projectId}`);
  },
  
  // Send error event directly from frontend
  sendEvent: async (dsn: string, eventData: {
    errorType: string;
    message: string;
    stacktrace: string;
    userAgent?: string;
    statusCode?: number;
    userContext?: UserContext;
    tags?: Tags;
  }) => {
    return apiRequest<{ success: boolean }>('/events', {
      method: 'POST',
      headers: {
        'X-DSN': dsn
      },
      body: JSON.stringify(eventData),
    });
  }
};

/**
 * Error Groups API endpoints
 */
export const GroupsAPI = {
  // Get error groups for a project
  getGroups: async (projectId: string) => {
    return apiRequest<Array<{
      id: string;
      errorType: string;
      message: string;
      count: number;
      firstSeen: string;
      lastSeen: string;
      status: string;
      statusCode: number;
      assignedTo: string;
      updatedAt: string;
    }>>(`/projects/${projectId}/groups`);
  },

  // Get events in a group
  getGroupEvents: async (groupId: string) => {
    return apiRequest<Array<{
      id: string;
      errorType: string;
      message: string;
      timestamp: string;
      stacktrace: string;
      userAgent: string;
      statusCode: number;
      userContext: UserContext;
      tags: Tags;
    }>>(`/groups/${groupId}/events`);
  },

  // Change group status
  changeGroupStatus: async (groupId: string, status: string) => {
    return apiRequest<{
      id: string;
      status: string;
    }>(`/groups/${groupId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Assign group to member
  assignGroup: async (groupId: string, memberId: string | null) => {
    return apiRequest<{
      id: string;
      assignedTo: string;
    }>(`/groups/${groupId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ memberId }),
    });
  },

  // Get comments for a group
  getComments: async (groupId: string) => {
    return apiRequest<Array<{
      id: string;
      content: string;
      createdAt: string;
      author: {
        id: string;
        user: {
          id: string;
          email: string;
        };
      };
    }>>(`/groups/${groupId}/comments`);
  },

  // Add comment to group
  addComment: async (groupId: string, content: string) => {
    return apiRequest<{
      id: string;
      content: string;
      createdAt: string;
      author: {
        id: string;
        user: {
          id: string;
          email: string;
        };
      };
    }>(`/groups/${groupId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

/**
 * Webhooks API endpoints
 */
export const WebhooksAPI = {
  // Get webhooks for a project
  getWebhooks: async (projectId: string) => {
    return apiRequest<Array<{
      id: string;
      url: string;
      enabled: boolean;
      eventType: string;
      secret: string;
      createdAt: string;
    }>>(`/projects/${projectId}/webhooks`);
  },

  // Create a new webhook
  createWebhook: async (
    projectId: string, 
    data: { url: string; enabled: boolean; eventType: string; secret: string }
  ) => {
    return apiRequest<{
      id: string;
      url: string;
      enabled: boolean;
      eventType: string;
      secret: string;
      createdAt: string;
    }>(`/projects/${projectId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update webhook
  updateWebhook: async (
    webhookId: string,
    data: { url: string; enabled: boolean; eventType: string; secret: string }
  ) => {
    return apiRequest<{
      id: string;
      url: string;
      enabled: boolean;
      eventType: string;
      secret: string;
      createdAt: string;
    }>(`/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete webhook
  deleteWebhook: async (webhookId: string) => {
    return apiRequest<{ success: boolean }>(`/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  },

  // Get webhook delivery logs
  getWebhookDeliveries: async (webhookId: string, page = 1, limit = 10) => {
    return apiRequest<{
      data: Array<{
        id: string;
        webhookId: string;
        eventId: string | null;
        requestBody: string;
        responseBody: string | null;
        statusCode: number | null;
        success: boolean;
        error: string | null;
        sentAt: string;
        responseAt: string | null;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/webhooks/${webhookId}/deliveries?page=${page}&limit=${limit}`);
  },

  // Get webhook delivery detail
  getWebhookDeliveryDetail: async (deliveryId: string) => {
    return apiRequest<{
      id: string;
      webhookId: string;
      eventId: string | null;
      requestBody: string;
      responseBody: string | null;
      statusCode: number | null;
      success: boolean;
      error: string | null;
      sentAt: string;
      responseAt: string | null;
      webhook: {
        id: string;
        url: string;
        enabled: boolean;
        eventType: string | null;
        secret: string | null;
        createdAt: string;
      };
    }>(`/webhook-deliveries/${deliveryId}`);
  },

  // Retry webhook delivery
  retryWebhookDelivery: async (deliveryId: string) => {
    return apiRequest<{
      success: boolean;
      delivery?: {
        id: string;
        webhookId: string;
        eventId: string | null;
        requestBody: string;
        responseBody: string | null;
        statusCode: number | null;
        success: boolean;
        error: string | null;
        sentAt: string;
        responseAt: string | null;
      };
      error?: string;
    }>(`/webhook-deliveries/${deliveryId}/retry`, {
      method: 'POST',
    });
  },
};

/**
 * Stats API endpoints
 */
export const StatsAPI = {
  // Get project stats for dashboard
  getProjectStats: async (projectId: string, timeframe: 'day' | 'week' | 'month' = 'day') => {
    return apiRequest<{
      totalEvents: number;
      totalGroups: number;
      openGroups: number;
      resolvedGroups: number;
      ignoredGroups: number;
      eventsByHour: Array<{ hour: string; count: number }>;
    }>(`/stats/projects/${projectId}?timeframe=${timeframe}`);
  },
  
  // Get error distribution by browser/OS/device
  getErrorDistribution: async (projectId: string, category: 'browser' | 'os' | 'device') => {
    return apiRequest<Array<{
      name: string;
      count: number;
      percentage: number;
    }>>(`/stats/projects/${projectId}/distribution/${category}`);
  }
};

/**
 * Export API endpoints
 */
export const ExportAPI = {
  // Export errors as CSV
  exportErrorsCSV: async (projectId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  }) => {
    const queryParams = filters 
      ? '?' + new URLSearchParams(filters as Record<string, string>).toString() 
      : '';
    
    return apiRequest<{ downloadUrl: string }>(
      `/export/projects/${projectId}/errors/csv${queryParams}`
    );
  },
  
  // Export errors as JSON
  exportErrorsJSON: async (projectId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  }) => {
    const queryParams = filters 
      ? '?' + new URLSearchParams(filters as Record<string, string>).toString() 
      : '';
    
    return apiRequest<{ downloadUrl: string }>(
      `/export/projects/${projectId}/errors/json${queryParams}`
    );
  }
};

/**
 * Notification API endpoints
 */
export const NotificationAPI = {
  // Get notification settings
  getNotificationSettings: async (projectId: string) => {
    return apiRequest<{
      email: boolean;
      slack: boolean;
      slackWebhookUrl?: string;
      notifyOnNewError: boolean;
      notifyOnResolvedError: boolean;
      minimumErrorLevel: 'info' | 'warning' | 'error' | 'fatal';
    }>(`/notifications/projects/${projectId}/settings`);
  },
  
  // Update notification settings
  updateNotificationSettings: async (
    projectId: string,
    settings: {
      email?: boolean;
      slack?: boolean;
      slackWebhookUrl?: string;
      notifyOnNewError?: boolean;
      notifyOnResolvedError?: boolean;
      minimumErrorLevel?: 'info' | 'warning' | 'error' | 'fatal';
    }
  ) => {
    return apiRequest<{ success: boolean }>(
      `/notifications/projects/${projectId}/settings`,
      {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }
    );
  },
  
  // Test notification
  testNotification: async (projectId: string, type: 'email' | 'slack') => {
    return apiRequest<{ success: boolean }>(
      `/notifications/projects/${projectId}/test`,
      {
        method: 'POST',
        body: JSON.stringify({ type }),
      }
    );
  }
}; 