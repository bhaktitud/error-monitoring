import { LogRavenContext } from "./init";

export function captureException(error: Error, context: Record<string, any> = {}) {
    if (!LogRavenContext.config) {
      console.warn('[LogRaven] SDK not initialized');
      return;
    }
  
    const payload = {
      errorType: error.name,
      message: error.message,
      stacktrace: error.stack,
  
      userAgent: context.headers?.['user-agent'],
      statusCode: context.statusCode ?? 500,
      userContext: LogRavenContext.user,
      tags: LogRavenContext.tags,
  
      os: context.os,
      osVersion: context.osVersion,
      browser: context.browser,
      browserVersion: context.browserVersion,
      deviceType: context.deviceType,
  
      url: context.url,
      path: context.path,
      query: context.query,
      method: context.method,
      params: context.params,
      headers: context.headers,
      ip: context.ip ?? context.headers?.['x-forwarded-for'] ?? null,
      language: context.headers?.['accept-language'],
      referrer: context.headers?.['referer'],
  
      extraContext: context,
      release: LogRavenContext.config.release,
      environment: LogRavenContext.config.environment,
      screenSize: context.screenSize ?? null,
  
      timestamp: new Date().toISOString(),
    };
  
    fetch(`${LogRavenContext.config.apiUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dsn': LogRavenContext.config.dsn,
      },
      body: JSON.stringify(payload),
    }).then(res => {
      console.log('[LogRaven] Event sent, status:', res.status);
    }).catch(err => {
      console.error('[LogRaven] Failed to send error', err);
    });
  }
  