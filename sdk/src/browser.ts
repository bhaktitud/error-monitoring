import { init as coreInit } from './core/init';
import { setUser, setTags, addBreadcrumb } from './core/context';
import type { BrowserSDKOptions } from './types/browser';
import { captureException } from './core/capture';

export function init(options: BrowserSDKOptions) {
  coreInit(options);

  if (typeof window === 'undefined') return;

  const sdk = options.sdk ?? {};

  if (sdk.captureUnhandledErrors !== false) {
    window.onerror = (message, source, lineno, colno, error) => {
      captureException(error || new Error(String(message)), {
        extraContext: { source, lineno, colno }
      });
    };
  }

  if (sdk.captureUnhandledRejections !== false) {
    window.onunhandledrejection = (event) => {
      captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      );
    };
  }

  if (sdk.captureConsoleErrors !== false) {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      addBreadcrumb('console', 'console.error', { args });
      originalConsoleError(...args);
    };
  }

  if (sdk.captureFetchErrors !== false && window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const res = await originalFetch(...args);
        if (!res.ok) {
          captureException(new Error(`Fetch failed: ${res.status} ${res.statusText}`), {
            extraContext: { url: res.url, status: res.status }
          });
        }
        return res;
      } catch (error) {
        captureException(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    };
  }

  if (sdk.captureXHRErrors !== false && XMLHttpRequest) {
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (...args) {
      this.addEventListener('error', () => {
        captureException(new Error(`XHR error on ${this.responseURL}`));
      });
      this.addEventListener('abort', () => {
        captureException(new Error(`XHR aborted: ${this.responseURL}`));
      });
      this.addEventListener('timeout', () => {
        captureException(new Error(`XHR timeout: ${this.responseURL}`));
      });
      originalSend.apply(this, args);
    };
  }
}

export { captureException, setUser, setTags, addBreadcrumb };
