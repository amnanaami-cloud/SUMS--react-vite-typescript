import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly production: boolean) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody = exception instanceof HttpException ? exception.getResponse() : undefined;
    const details =
      typeof exceptionBody === 'object' && exceptionBody !== null && 'message' in exceptionBody
        ? (exceptionBody as { message: unknown }).message
        : undefined;
    const code = this.codeFor(status, exceptionBody);
    const safeMessage =
      status >= 500 && this.production ? 'An unexpected error occurred' : this.messageFor(exceptionBody, status);
    response.status(status).json({
      statusCode: status,
      code,
      message: safeMessage,
      details: Array.isArray(details) ? details : [],
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  private codeFor(status: number, body: unknown): string {
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
    ) {
      const candidate = (body as { message: string }).message;
      if (/^[A-Z][A-Z0-9_]+$/.test(candidate)) return candidate;
    }
    return (
      (
        {
          400: 'VALIDATION_ERROR',
          401: 'UNAUTHORIZED',
          403: 'FORBIDDEN',
          404: 'NOT_FOUND',
          409: 'CONFLICT',
          429: 'RATE_LIMITED',
        } as Record<number, string>
      )[status] ?? 'INTERNAL_ERROR'
    );
  }

  private messageFor(body: unknown, status: number): string {
    if (typeof body === 'string') return body;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: unknown }).message;
      if (typeof message === 'string') return message;
    }
    return status >= 500 ? 'An unexpected error occurred' : 'Request failed';
  }
}
