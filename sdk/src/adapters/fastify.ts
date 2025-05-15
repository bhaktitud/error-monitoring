import { captureException } from '../core/capture';
import { LogRavenContext } from '../core/init';

/**
 * Middleware untuk melacak request di Fastify
 * 
 * Contoh penggunaan:
 * ```javascript
 * import fastify from 'fastify';
 * import { logRavenFastifyPlugin } from '@lograven/sdk';
 * 
 * const app = fastify();
 * 
 * // Register the plugin
 * app.register(logRavenFastifyPlugin);
 * ```
 */
export function logRavenFastifyPlugin(fastify: any, options: any, done: () => void) {
  if (!LogRavenContext.config) {
    console.error('[LogRaven] SDK belum diinisialisasi. Panggil init() terlebih dahulu.');
    done();
    return;
  }
  
  // Middleware untuk melacak setiap request
  fastify.addHook('onRequest', (request: any, reply: any, done: (err?: Error) => void) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Simpan di state untuk digunakan di onResponse
    request.logRaven = {
      startTime,
      requestId
    };
    
    // Tambahkan breadcrumb untuk request
    LogRavenContext.breadcrumbs.push({
      category: 'http',
      message: `${request.method} ${request.url}`,
      data: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        requestId
      },
      level: 'info',
      timestamp: new Date().toISOString()
    });
    
    done();
  });
  
  // Middleware untuk menangkap response
  fastify.addHook('onResponse', (request: any, reply: any, done: () => void) => {
    if (request.logRaven) {
      const duration = Date.now() - request.logRaven.startTime;
      const { requestId } = request.logRaven;
      
      // Tambahkan breadcrumb untuk response
      LogRavenContext.breadcrumbs.push({
        category: 'http',
        message: `Response: ${reply.statusCode} (${duration}ms)`,
        data: {
          statusCode: reply.statusCode,
          duration,
          requestId
        },
        level: 'info',
        timestamp: new Date().toISOString()
      });
    }
    
    done();
  });
  
  // Error handler
  fastify.setErrorHandler((error: Error, request: any, reply: any) => {
    try {
      // Ambil informasi request
      const method = request.method;
      const url = request.url;
      const headers = request.headers;
      const body = request.body;
      
      captureException(error, {
        tags: {
          framework: 'fastify',
          method,
          url,
          statusCode: reply.statusCode.toString()
        },
        extra: {
          headers,
          body,
          params: request.params,
          query: request.query
        }
      });
    } catch (e) {
      console.error('[LogRaven] Error in Fastify error handler:', e);
    }
    
    reply.send(error);
  });
  
  done();
}

/**
 * Fungsi middleware untuk digunakan secara terpisah dari plugin
 */
export function logRavenFastifyErrorHandler(error: Error, request: any, reply: any) {
  if (!LogRavenContext.config) {
    console.error('[LogRaven] SDK belum diinisialisasi. Panggil init() terlebih dahulu.');
    throw error;
  }
  
  try {
    // Ambil informasi request
    const method = request.method;
    const url = request.url;
    const headers = request.headers;
    const body = request.body;
    
    captureException(error, {
      tags: {
        framework: 'fastify',
        method,
        url,
        statusCode: reply.statusCode.toString()
      },
      extra: {
        headers,
        body,
        params: request.params,
        query: request.query
      }
    });
  } catch (e) {
    console.error('[LogRaven] Error in Fastify error handler:', e);
  }
  
  throw error;
} 