import { captureException } from '../core/capture';
import { LogRavenContext } from '../core/init';

// Interface untuk Angular ErrorHandler
interface ErrorHandler {
  handleError(error: any): void;
}

/**
 * LogRaven Angular Error Handler untuk digunakan dengan Angular ErrorHandler
 * 
 * Contoh penggunaan:
 * 
 * ```typescript
 * // app.module.ts
 * import { ErrorHandler, NgModule } from '@angular/core';
 * import { LogRavenErrorHandler } from '@lograven/sdk/angular';
 * 
 * @NgModule({
 *   providers: [
 *     { provide: ErrorHandler, useClass: LogRavenErrorHandler }
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
export class LogRavenErrorHandler implements ErrorHandler {
  /**
   * Handler asli yang akan dipanggil setelah LogRaven memproses error
   */
  private readonly originalHandler?: ErrorHandler;

  /**
   * @param originalHandler Optional handler yang akan dipanggil setelah LogRaven memproses error
   */
  constructor(originalHandler?: ErrorHandler) {
    this.originalHandler = originalHandler;
  }

  /**
   * Handles errors
   * @param error Error yang terjadi
   */
  handleError(error: any): void {
    try {
      if (!LogRavenContext.config) {
        console.error('[LogRaven] SDK belum diinisialisasi. Panggil init() terlebih dahulu.');
        return;
      }

      let errorToCapture: Error;
      
      if (error instanceof Error) {
        errorToCapture = error;
      } else if (typeof error === 'string') {
        errorToCapture = new Error(error);
      } else {
        try {
          errorToCapture = new Error(JSON.stringify(error));
        } catch {
          errorToCapture = new Error(`Unknown Angular error: ${error}`);
        }
      }

      captureException(errorToCapture, {
        tags: {
          framework: 'angular'
        }
      });
    } catch (e) {
      console.error('[LogRaven] Error in Angular error handler:', e);
    }

    // Panggil original handler jika ada
    if (this.originalHandler) {
      this.originalHandler.handleError(error);
    }
  }
}

/**
 * HTTP Interceptor untuk Angular untuk menangkap error HTTP
 * 
 * Contoh penggunaan:
 * 
 * ```typescript
 * // app.module.ts
 * import { HTTP_INTERCEPTORS } from '@angular/common/http';
 * import { LogRavenHttpInterceptor } from '@lograven/sdk/angular';
 * 
 * @NgModule({
 *   providers: [
 *     { provide: HTTP_INTERCEPTORS, useClass: LogRavenHttpInterceptor, multi: true }
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
export class LogRavenHttpInterceptor {
  /**
   * Intercept HTTP requests
   */
  intercept(req: any, next: any) {
    return next.handle(req).pipe(
      catchError((error: any) => {
        if (!LogRavenContext.config) {
          console.error('[LogRaven] SDK belum diinisialisasi. Panggil init() terlebih dahulu.');
          return throwError(() => error);
        }
        
        try {
          const httpError = new Error(`HTTP Error ${error.status || 'unknown'}: ${error.message || 'No details'}`);
          
          captureException(httpError, {
            tags: {
              framework: 'angular',
              type: 'http',
              status: error.status?.toString() || 'unknown',
              method: req.method || 'unknown',
              url: req.url || 'unknown'
            },
            extra: {
              body: req.body ? JSON.stringify(req.body) : 'none',
              responseError: error
            }
          });
        } catch (e) {
          console.error('[LogRaven] Error in HTTP interceptor:', e);
        }
        
        return throwError(() => error);
      })
    );
  }
}

// Helper untuk TypeScript (ini tidak ada dalam runtime, hanya untuk type checking)
function catchError(callback: any) {
  return function(source: any) {
    return source;
  };
}

function throwError(errorFactory: () => any) {
  return {
    pipe: (..._: any[]) => throwError(errorFactory)
  };
} 