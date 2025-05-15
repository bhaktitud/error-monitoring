import { captureException } from '../core/capture';
import { LogRavenContext } from '../core/init';

/**
 * Vue 2 Global Error Handler
 * @param Vue Vue constructor
 */
export function installVue2(Vue: any) {
  if (!LogRavenContext.config) {
    console.error('[LogRaven] SDK belum diinisialisasi. Panggil init() terlebih dahulu.');
    return;
  }

  const originalErrorHandler = Vue.config.errorHandler;
  
  Vue.config.errorHandler = function(err: Error, vm: any, info: string) {
    try {
      const componentName = vm?.$options?.name || 'AnonymousComponent';
      
      captureException(err, {
        tags: {
          vue: 'true',
          componentName,
          lifecycleHook: info || 'unknown'
        },
        extra: {
          componentData: vm ? JSON.stringify(vm.$data) : 'unavailable',
          props: vm ? JSON.stringify(vm.$props) : 'unavailable',
          info
        }
      });
    } catch (e) {
      console.error('[LogRaven] Error in Vue error handler:', e);
    }

    // Call original error handler if it exists
    if (typeof originalErrorHandler === 'function') {
      originalErrorHandler.call(Vue, err, vm, info);
    }
  };

  console.log('[LogRaven] Vue 2 error handler installed');
}

/**
 * Vue 3 Global Error Handler
 * @param app Vue 3 application instance
 */
export function installVue3(app: any) {
  if (!LogRavenContext.config) {
    console.error('[LogRaven] SDK belum diinisialisasi. Panggil init() terlebih dahulu.');
    return;
  }

  const originalErrorHandler = app.config.errorHandler;
  
  app.config.errorHandler = function(err: Error, vm: any, info: string) {
    try {
      const componentName = vm?.__name || vm?.type?.name || 'AnonymousComponent';
      
      captureException(err, {
        tags: {
          vue: 'true',
          version: '3',
          componentName,
          lifecycleHook: info || 'unknown'
        },
        extra: {
          info,
          componentInstance: vm ? JSON.stringify(vm) : 'unavailable'
        }
      });
    } catch (e) {
      console.error('[LogRaven] Error in Vue error handler:', e);
    }

    // Call original error handler if it exists
    if (typeof originalErrorHandler === 'function') {
      originalErrorHandler.call(app, err, vm, info);
    }
  };

  console.log('[LogRaven] Vue 3 error handler installed');
} 