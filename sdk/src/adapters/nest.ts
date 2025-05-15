import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    Catch,
    ArgumentsHost,
    ExceptionFilter,
    HttpException,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { Observable, tap } from 'rxjs';
  import { addBreadcrumb, setUser } from '../core/context';
import { captureException } from '../core/capture';
  
  @Injectable()
  export class LogRavenInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const httpCtx = context.switchToHttp();
      const req = httpCtx.getRequest<Request>();
      const res = httpCtx.getResponse<Response>();
      const startTime = Date.now();
  
      if ((req as any).user) {
        setUser(req.user as any);
      }
  
      addBreadcrumb('http', 'Incoming request', {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
      });
  
      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;
          addBreadcrumb('http', 'Response sent', {
            statusCode: res.statusCode,
            duration,
          });
        })
      );
    }
  }
  
  @Catch()
  export class LogRavenExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const req = ctx.getRequest<Request>();
      const res = ctx.getResponse<Response>();
  
      addBreadcrumb('error', 'Error handled by NestJS filter', {
        message: exception.message,
        statusCode: exception.status || res.statusCode,
      }, 'error');
  
      captureException(exception, {
        path: req.path,
        method: req.method,
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body,
        url: req.originalUrl,
        ip: req.ip,
        language: req.headers['accept-language'],
        referrer: req.headers['referer'],
        statusCode: exception.status || res.statusCode,
      });
    }
  }
  