import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

// Definisi tipe untuk opsi SDK
interface SDKOptions {
  captureUnhandledRejections?: boolean;
  captureUncaughtExceptions?: boolean;
  breadcrumbs?: boolean;
  maxBreadcrumbs?: number;
  beforeSend?: (payload: EventPayload, error: Error) => EventPayload | null;
}

// Definisi tipe untuk inisialisasi
interface InitOptions {
  dsn: string;
  apiUrl?: string;
  environment?: string;
  release?: string;
  sdk?: SDKOptions;
}

// Definisi tipe untuk user
interface User {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}

// Definisi tipe untuk tags
interface Tags {
  [key: string]: string | number | boolean;
}

// Definisi tipe untuk breadcrumb
interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  data?: Record<string, any>;
  level?: 'info' | 'warning' | 'error';
}

// Definisi tipe untuk event payload
interface EventPayload {
  errorType: string;
  message: string;
  stacktrace?: string;
  timestamp: string;
  environment: string;
  release: string;
  userAgent: string;
  statusCode: number | null;
  url: string;
  method: string;
  path: string;
  query: Record<string, any>;
  params: Record<string, any>;
  headers: Record<string, string>;
  userContext: User | null;
  tags: Tags;
  breadcrumbs: Breadcrumb[];
  extraContext: Record<string, any>;
}

// Variabel global
let DSN: string = '';
let API_URL: string = '';
let USER: User | null = null;
let TAGS: Tags | null = null;
let ENVIRONMENT: string = 'development';
let RELEASE: string = '';
let SDK_OPTIONS: SDKOptions = {
  captureUnhandledRejections: true,
  captureUncaughtExceptions: true,
  breadcrumbs: true,
  maxBreadcrumbs: 100,
  beforeSend: undefined,
};

const breadcrumbs: Breadcrumb[] = [];

/**
 * Inisialisasi SDK
 */
function init({ dsn, apiUrl, environment, release, sdk = {} }: InitOptions): void {
  if (!dsn) {
    throw new Error('DSN is required');
  }
  
  DSN = dsn;
  API_URL = apiUrl || 'http://localhost:3000';
  ENVIRONMENT = environment || 'development';
  RELEASE = release || '';
  SDK_OPTIONS = { ...SDK_OPTIONS, ...sdk };

  if (SDK_OPTIONS.captureUnhandledRejections && typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason: any) => {
      captureException(
        reason instanceof Error ? reason : new Error(`Unhandled Promise rejection: ${reason}`)
      );
    });
  }

  if (SDK_OPTIONS.captureUncaughtExceptions && typeof process !== 'undefined') {
    process.on('uncaughtException', (error: Error) => {
      captureException(error);
    });
  }
}

/**
 * Atur informasi user
 */
function setUser(user: User): void {
  USER = user;
}

/**
 * Atur tags untuk semua event
 */
function setTags(tags: Tags): void {
  TAGS = tags;
}

/**
 * Tambahkan breadcrumb
 */
function addBreadcrumb({ 
  category, 
  message, 
  data = {}, 
  level = 'info' 
}: Omit<Breadcrumb, 'timestamp'>): void {
  if (!SDK_OPTIONS.breadcrumbs) return;
  
  const breadcrumb: Breadcrumb = {
    timestamp: new Date().toISOString(),
    category,
    message,
    level,
    data
  };

  breadcrumbs.push(breadcrumb);
  
  if (breadcrumbs.length > (SDK_OPTIONS.maxBreadcrumbs || 100)) {
    breadcrumbs.shift();
  }
}

/**
 * Tangkap dan kirim exception
 */
async function captureException(
  error: Error, 
  options: Partial<EventPayload> = {}
): Promise<any> {
  if (!DSN) throw new Error('SDK belum di-init. Panggil init({dsn, apiUrl}) dulu.');

  if (!(error instanceof Error)) {
    error = new Error(String(error));
  }

  const payload: EventPayload = {
    errorType: error.name,
    message: error.message,
    stacktrace: error.stack,
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    release: RELEASE,
    userAgent: options.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    statusCode: options.statusCode || null,
    url: options.url || (typeof window !== 'undefined' ? window.location.href : ''),
    method: options.method || '',
    path: options.path || '',
    query: options.query || {},
    params: options.params || {},
    headers: sanitizeHeaders(options.headers || {}),
    userContext: options.userContext || USER,
    tags: { ...(TAGS || {}), ...(options.tags || {}) },
    breadcrumbs: SDK_OPTIONS.breadcrumbs ? [...breadcrumbs] : [],
    extraContext: options.extraContext || {},
  };

  let modifiedPayload = payload;
  if (SDK_OPTIONS.beforeSend && typeof SDK_OPTIONS.beforeSend === 'function') {
    const result = SDK_OPTIONS.beforeSend(payload, error);
    if (!result) return;
    modifiedPayload = result;
  }

  try {
    const response = await axios.post(`${API_URL}/api/events`, modifiedPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-dsn': DSN,
      },
    });
    return response.data;
  } catch (err) {
    return { error: 'Gagal mengirim error ke LogRaven server' };
  }
}

/**
 * Tangkap dan kirim pesan
 */
function captureMessage(
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info', 
  options: Partial<EventPayload> = {}
): Promise<any> {
  const error = new Error(message);
  error.name = `Message_${level.toUpperCase()}`;
  return captureException(error, {
    ...options,
    extraContext: { ...options.extraContext, logLevel: level },
  });
}

/**
 * Sanitasi header
 */
function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized = { ...headers };
  const sensitiveKeys = ['authorization', 'cookie', 'set-cookie', 'x-auth-token'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Sanitasi request body
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return {};
  
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'passwordConfirmation', 'token', 'secret', 'credit_card'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key.toLowerCase()) || key.toLowerCase().includes('password')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeRequestBody(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Getter untuk keperluan test
export function getUser(): User | null {
  return USER;
}

export function getTags(): Tags | null {
  return TAGS;
}

export function getBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs];
}

/**
 * Middleware untuk Express yang menangkap error
 */
function withErrorMonitoring() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Convert headers to Record<string, string>
    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    });

    captureException(err, {
      url: req.url,
      method: req.method,
      path: req.path,
      query: req.query as Record<string, any>,
      params: req.params,
      headers,
      userContext: (req as any).user || null,
    });
    next(err);
  };
}

// Ekspor semua fungsi
export {
  init,
  setUser,
  setTags,
  addBreadcrumb,
  captureException,
  captureMessage,
  withErrorMonitoring,
  type SDKOptions,
  type InitOptions,
  type User,
  type Tags,
  type Breadcrumb,
  type EventPayload
}; 