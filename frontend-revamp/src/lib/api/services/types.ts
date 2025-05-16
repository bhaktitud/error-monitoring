// Interface untuk user context dan tags
export interface UserContext {
  userId?: string;
  [key: string]: unknown;
}

export interface Tags {
  version?: string;
  [key: string]: unknown;
}

// Interface untuk Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  apiKey?: string;
  environment?: string;
  isActive: boolean;
  stats?: {
    events24h: number;
    totalEvents: number;
    openIssues: number;
    resolvedIssues: number;
  };
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