// Interface untuk user context dan tags
export interface UserContext {
  userId?: string;
  [key: string]: unknown;
}

export interface Tags {
  version?: string;
  [key: string]: unknown;
}

// Interface untuk Event
export interface Event {
  id: string;
  errorType: string;
  message: string;
  timestamp: string;
  stacktrace?: string;
  userAgent?: string;
  statusCode?: number;
  userContext?: UserContext;
  tags?: Tags;
  browser?: string;
  browserVersion?: string;
  deviceType?: string;
  environment?: string;
  os?: string;
  osVersion?: string;
  release?: string;
  url?: string;
  method?: string;
  path?: string;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  ip?: string;
  language?: string;
  referrer?: string;
  screenSize?: string;
  code?: string;
  group?: {
    id: string;
    errorType: string;
    status: string;
    count: number;
  };
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
    features: Record<string, unknown>;
  };
}

// Definisikan tipe untuk Source Map
export interface SourceMap {
  id: string;
  release: string;
  sourceFile: string;
  minifiedFile: string | null;
  filename: string;
  environment: string | null;
  originalFiles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 