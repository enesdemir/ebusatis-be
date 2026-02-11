import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorApiResponse } from '../interfaces/api-response.interface';

/**
 * Global exception filter that formats all error responses in the standard envelope:
 * { success: false, error: "...", message: "...", statusCode: 4xx/5xx, timestamp: "...", path: "..." }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    // Extract message from NestJS exception response (can be string or object)
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      error = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, any>;
      message = resp.message || message;
      error = resp.error || error;
      // class-validator returns message as array
      if (Array.isArray(message)) {
        message = message.join(', ');
      }
    }
    // Log server errors
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    const errorResponse: ErrorApiResponse = {
      success: false,
      error,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    response.status(statusCode).json(errorResponse);
  }
}
