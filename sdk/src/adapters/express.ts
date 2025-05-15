import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { addBreadcrumb } from '../core/context';
import { setUser } from '../core/context';
import { captureException } from '../core/capture';
export function logRavenRequestTracker(): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    (req as any).requestId = requestId;
    (req as any).startTime = Date.now();

    if ((req as any).user) {
      setUser({
        id: (req as any).user.id,
        username: (req as any).user.username,
        role: (req as any).user.role,
      });
    }

    addBreadcrumb('http', 'Incoming request', {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      query: req.query,
      params: req.params,
    });

    res.on('finish', () => {
      const duration = Date.now() - (req as any).startTime;
      addBreadcrumb('http', 'Response sent', {
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  };
}

export function logRavenErrorHandler(): ErrorRequestHandler {
  return function (err: any, req: Request, res: Response, next: NextFunction) {
    const requestId = (req as any).requestId ?? `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const errorId = `err-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    try {
      addBreadcrumb('error', 'Error captured by middleware', {
        errorId,
        requestId,
        message: err.message,
        code: err.code,
        statusCode: err.statusCode || 500,
      }, 'error');

      captureException(err, {
        requestId,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body,
        headers: req.headers,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        statusCode: err.statusCode || res.statusCode,
        os: req.headers['sec-ch-ua-platform'],
        browser: req.headers['sec-ch-ua'],
        language: req.headers['accept-language'],
        referrer: req.headers['referer'],
      });
    } catch (sdkErr) {
      console.error('[LogRaven] Failed to report error:', sdkErr);
    }

    next(err);
  };
}
