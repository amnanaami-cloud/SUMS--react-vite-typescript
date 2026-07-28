import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const inbound = request.headers['x-request-id'];
    const requestId = typeof inbound === 'string' && inbound.length <= 100 ? inbound : randomUUID();
    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    const startedAt = Date.now();
    return next.handle().pipe(
      tap({
        finalize: () => {
          this.logger.log(
            JSON.stringify({
              requestId,
              method: request.method,
              path: request.originalUrl.split('?')[0],
              statusCode: response.statusCode,
              durationMs: Date.now() - startedAt,
              actorUserId: request.user?.id,
            }),
          );
        },
      }),
    );
  }
}
