import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

// Definisi tipe untuk opsi SDK
interface SDKOptions {
  captureUnhandledRejections?: boolean;
  captureUncaughtExceptions?: boolean;
  captureUnhandledErrors?: boolean; // Untuk browser
  breadcrumbs?: boolean;
  maxBreadcrumbs?: number;
  beforeSend?: (payload: EventPayload, error: Error) => EventPayload | null;
  captureConsoleErrors?: boolean; // Menangkap console.error
  captureNetworkErrors?: boolean; // Menangkap error fetch/XHR
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
  // Tambahan metadata
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  deviceType?: string;
  screenSize?: string;
  ip?: string;
  language?: string;
  referrer?: string;
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
  captureUnhandledErrors: true,
  captureConsoleErrors: true,
  captureNetworkErrors: true,
  breadcrumbs: true,
  maxBreadcrumbs: 100,
  beforeSend: undefined,
};

const breadcrumbs: Breadcrumb[] = [];

/**
 * Deteksi informasi browser dan OS
 */
function detectBrowserAndOS(): {
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  deviceType: string;
  screenSize: string;
  language: string;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      os: 'unknown',
      osVersion: 'unknown',
      browser: 'unknown',
      browserVersion: 'unknown',
      deviceType: 'unknown',
      screenSize: 'unknown',
      language: 'unknown',
    };
  }

  const userAgent = navigator.userAgent;

  // OS detection
  let os = 'unknown';
  let osVersion = 'unknown';
  
  if (userAgent.indexOf('Win') !== -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') !== -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
  else if (userAgent.indexOf('Android') !== -1) os = 'Android';
  else if (userAgent.indexOf('like Mac') !== -1) os = 'iOS';

  // Browser detection
  let browser = 'unknown';
  let browserVersion = 'unknown';
  
  if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1 && userAgent.indexOf('OPR') === -1) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Firefox') !== -1) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('Edg') !== -1) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.indexOf('OPR') !== -1) {
    browser = 'Opera';
    const match = userAgent.match(/OPR\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  }

  // Device type detection
  let deviceType = 'Desktop';
  if (userAgent.match(/iPad|iPhone|iPod/i)) {
    deviceType = 'Mobile iOS';
  } else if (userAgent.match(/Android/i)) {
    deviceType = 'Mobile Android';
  } else if (userAgent.match(/Windows Phone/i)) {
    deviceType = 'Mobile Windows';
  }

  // Screen size
  const screenSize = typeof window !== 'undefined' ? 
    `${window.screen.width}x${window.screen.height}` : 'unknown';

  // Language
  const language = navigator.language || 'unknown';

  return {
    os,
    osVersion,
    browser,
    browserVersion,
    deviceType,
    screenSize,
    language,
  };
}

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

  if (SDK_OPTIONS.captureUnhandledRejections) {
    if (typeof process !== 'undefined') {
      // Node.js
      process.on('unhandledRejection', (reason: any) => {
        captureException(
          reason instanceof Error ? reason : new Error(`Unhandled Promise rejection: ${reason}`)
        );
      });
    } else if (typeof window !== 'undefined') {
      // Browser
      window.addEventListener('unhandledrejection', (event) => {
        captureException(
          event.reason instanceof Error 
            ? event.reason 
            : new Error(`Unhandled Promise rejection: ${event.reason}`)
        );
      });
    }
  }

  if (SDK_OPTIONS.captureUncaughtExceptions) {
    if (typeof process !== 'undefined') {
      // Node.js
      process.on('uncaughtException', (error: Error) => {
        captureException(error);
      });
    } else if (typeof window !== 'undefined') {
      // Browser
      window.addEventListener('error', (event) => {
        if (event.error) {
          captureException(event.error);
        } else {
          captureException(
            new Error(`Error in ${event.filename} at line ${event.lineno}:${event.colno}`)
          );
        }
      });
    }
  }

  // Hook untuk console.error
  if (SDK_OPTIONS.captureConsoleErrors && typeof console !== 'undefined' && typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const error = args[0] instanceof Error 
        ? args[0] 
        : new Error(`Console error: ${args.map(arg => String(arg)).join(' ')}`);
      
      captureException(error, { 
        extraContext: { 
          console: true, 
          arguments: args.map(arg => 
            arg instanceof Error 
              ? { name: arg.name, message: arg.message, stack: arg.stack } 
              : arg
          )
        } 
      });
      
      originalConsoleError.apply(console, args);
    };
  }

  // Hook untuk network errors (fetch dan XMLHttpRequest)
  if (SDK_OPTIONS.captureNetworkErrors && typeof window !== 'undefined') {
    // Patch fetch
    if (typeof fetch !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        try {
          const response = await originalFetch.apply(window, args);
          
          if (!response.ok) {
            const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].toString() : 'unknown';
            addBreadcrumb({
              category: 'http',
              message: `Fetch error: ${response.status} ${response.statusText}`,
              data: { url, status: response.status, method: args[1]?.method || 'GET' },
              level: 'error'
            });
          }
          
          return response;
        } catch (error) {
          captureException(
            error instanceof Error ? error : new Error(`Fetch error: ${String(error)}`), 
            { 
              extraContext: { 
                networkRequest: 'fetch', 
                url: typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].toString() : 'unknown',
                options: args[1] 
              } 
            }
          );
          throw error;
        }
      };
    }

    // Patch XMLHttpRequest
    if (typeof XMLHttpRequest !== 'undefined') {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      // Tambahkan definisi tipe untuk properties tambahan pada XMLHttpRequest
      type ExtendedXMLHttpRequest = XMLHttpRequest & {
        _logRavenUrl?: string | URL;
        _logRavenMethod?: string;
      };

      XMLHttpRequest.prototype.open = function(
        this: ExtendedXMLHttpRequest,
        method: string, 
        url: string | URL, 
        async: boolean = true, 
        username?: string | null, 
        password?: string | null
      ) {
        this._logRavenUrl = url;
        this._logRavenMethod = method;
        return originalOpen.apply(this, [method, url, async, username as string, password as string]);
      };

      XMLHttpRequest.prototype.send = function(this: ExtendedXMLHttpRequest, ...args) {
        this.addEventListener('error', () => {
          if (this._logRavenMethod && this._logRavenUrl) {
            captureException(new Error(`XHR failed: ${this._logRavenMethod} ${this._logRavenUrl}`), {
              extraContext: { 
                networkRequest: 'xhr', 
                url: this._logRavenUrl?.toString(), 
                method: this._logRavenMethod 
              }
            });
          }
        });

        this.addEventListener('load', () => {
          if (this.status >= 400 && this._logRavenMethod && this._logRavenUrl) {
            addBreadcrumb({
              category: 'http',
              message: `XHR error: ${this.status} for ${this._logRavenMethod} ${this._logRavenUrl}`,
              data: { 
                url: this._logRavenUrl?.toString(), 
                status: this.status, 
                method: this._logRavenMethod 
              },
              level: 'error'
            });
          }
        });
        
        return originalSend.apply(this, args);
      };
    }
  }

  // Tambahkan breadcrumb inisialisasi
  addBreadcrumb({
    category: 'sdk',
    message: 'SDK initialized',
    data: {
      environment: ENVIRONMENT,
      release: RELEASE,
    },
  });
}

/**
 * Inisialisasi SDK untuk React Native
 */
function initReactNative({ dsn, apiUrl, environment, release, sdk = {} }: InitOptions): void {
  init({ dsn, apiUrl, environment, release, sdk });

  // Set global error handler untuk React Native
  if (typeof global !== 'undefined') {
    // Define interface for React Native ErrorUtils
    interface ReactNativeGlobal {
      ErrorUtils?: {
        getGlobalHandler: () => (error: Error, isFatal: boolean) => void;
        setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void;
      };
    }

    const reactNativeGlobal = global as unknown as ReactNativeGlobal;
    
    if (reactNativeGlobal.ErrorUtils) {
      const originalHandler = reactNativeGlobal.ErrorUtils.getGlobalHandler();
      
      reactNativeGlobal.ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        captureException(error, {
          extraContext: {
            reactNative: true,
            isFatal
          }
        });
        
        // Juga panggil handler asli
        originalHandler(error, isFatal);
      });
    }
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

  // Detect browser dan OS info
  const deviceInfo = typeof window !== 'undefined' ? detectBrowserAndOS() : {
    os: 'unknown',
    osVersion: 'unknown',
    browser: 'unknown',
    browserVersion: 'unknown',
    deviceType: 'unknown',
    screenSize: 'unknown',
    language: 'unknown'
  };

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
    path: options.path || (typeof window !== 'undefined' ? window.location.pathname : ''),
    query: options.query || (typeof window !== 'undefined' ? 
      Object.fromEntries(new URLSearchParams(window.location.search)) : {}),
    params: options.params || {},
    headers: sanitizeHeaders(options.headers || {}),
    userContext: options.userContext || USER,
    tags: { ...(TAGS || {}), ...(options.tags || {}) },
    breadcrumbs: SDK_OPTIONS.breadcrumbs ? [...breadcrumbs] : [],
    extraContext: options.extraContext || {},
    // Metadata browser dan OS
    os: deviceInfo.os,
    osVersion: deviceInfo.osVersion,
    browser: deviceInfo.browser,
    browserVersion: deviceInfo.browserVersion,
    deviceType: deviceInfo.deviceType,
    screenSize: deviceInfo.screenSize,
    language: deviceInfo.language,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined
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

/**
 * Wrap untuk React Component
 */
function withErrorBoundary(Component: any, options: {
  fallback?: any;
  onError?: (error: Error, componentStack: string, componentName: string) => void;
} = {}) {
  if (typeof window === 'undefined') {
    // Server-side rendering, return component unchanged
    return Component;
  }

  // Fungsi ini akan diimplementasikan oleh pengguna di React
  // Sebagai panduan implementasi
  const guideline = `
    // Contoh implementasi:
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false };
      }
      
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      
      componentDidCatch(error, info) {
        // Kirim error ke LogRaven
        LogRaven.captureException(error, {
          extraContext: {
            componentStack: info.componentStack,
            reactComponent: true,
            componentName: Component.displayName || Component.name || 'UnknownComponent'
          }
        });
        
        if (options.onError) {
          options.onError(error, info.componentStack, 
            Component.displayName || Component.name || 'UnknownComponent');
        }
      }
      
      render() {
        if (this.state.hasError) {
          return options.fallback || <div>Something went wrong.</div>;
        }
        return <Component {...this.props} />;
      }
    }
    
    return ErrorBoundary;
  `;
  
  // Ini hanya placeholder - implementasi nyata memerlukan React
  return Component;
}

// Ekspor semua fungsi
export {
  init,
  initReactNative,
  setUser,
  setTags,
  addBreadcrumb,
  captureException,
  captureMessage,
  withErrorMonitoring,
  withErrorBoundary,
  type SDKOptions,
  type InitOptions,
  type User,
  type Tags,
  type Breadcrumb,
  type EventPayload
}; 