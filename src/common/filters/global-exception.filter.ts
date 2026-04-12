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
 * Default error code + i18n key per HTTP status code.
 *
 * NestJS built-in exceptions (UnauthorizedException, NotFoundException,
 * BadRequestException etc.) do not include a stable `error` field or an
 * i18n key in their response body. This map provides sensible defaults
 * for those cases so the response envelope is uniform regardless of how
 * the exception was thrown.
 *
 * Custom AppException classes bypass this map because they already
 * carry their own `error` code and i18n key in the exception body.
 */
const STATUS_CODE_DEFAULTS: Record<number, { error: string; messageKey: string }> = {
  400: { error: 'BAD_REQUEST', messageKey: 'errors.http.bad_request' },
  401: { error: 'UNAUTHORIZED', messageKey: 'errors.http.unauthorized' },
  403: { error: 'FORBIDDEN', messageKey: 'errors.http.forbidden' },
  404: { error: 'NOT_FOUND', messageKey: 'errors.http.not_found' },
  405: { error: 'METHOD_NOT_ALLOWED', messageKey: 'errors.http.method_not_allowed' },
  409: { error: 'CONFLICT', messageKey: 'errors.http.conflict' },
  422: { error: 'UNPROCESSABLE_ENTITY', messageKey: 'errors.http.unprocessable_entity' },
  429: { error: 'TOO_MANY_REQUESTS', messageKey: 'errors.http.too_many_requests' },
  500: { error: 'INTERNAL_SERVER_ERROR', messageKey: 'errors.http.internal_server_error' },
  503: { error: 'SERVICE_UNAVAILABLE', messageKey: 'errors.http.service_unavailable' },
};

/**
 * Global exception filter — formats every error response into the
 * standard envelope:
 *   { success: false, error: 'CODE', message: 'i18n.key', metadata?, statusCode, timestamp, path }
 *
 * Custom AppException classes (TenantContextMissingException, etc.)
 * carry their own error code and i18n key. Built-in NestJS exceptions
 * are mapped to a sensible default through STATUS_CODE_DEFAULTS.
 *
 * The filter validates that any incoming `error` field looks like an
 * UPPERCASE_SNAKE error code and that any incoming `message` field
 * looks like an i18n key (starts with a known namespace). Otherwise it
 * falls back to the status-code default. This protects the contract
 * from leaking raw English text such as "Unauthorized" to the client.
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

    // Pick the status-code fallback first; AppException fields override it.
    const fallback = STATUS_CODE_DEFAULTS[statusCode] ?? STATUS_CODE_DEFAULTS[500];
    let error = fallback.error;
    let message = fallback.messageKey;
    let metadata: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, any>;
      // AppException contract:
      //   resp.error   — UPPERCASE_SNAKE_CASE error code (e.g. 'TENANT_FORBIDDEN')
      //   resp.message — i18n key (e.g. 'errors.tenant.forbidden')
      // Built-in NestJS exceptions do not follow this contract; they
      // return strings like "Bad Request" or "Unauthorized". The
      // heuristic checks below ensure only contract-compliant fields
      // are accepted; everything else falls back to the status default.
      if (typeof resp.error === 'string' && /^[A-Z][A-Z0-9_]*$/.test(resp.error)) {
        error = resp.error;
      }
      if (resp.message) {
        const raw = Array.isArray(resp.message) ? resp.message.join(', ') : String(resp.message);
        if (/^(errors|success|validation|warnings)\./.test(raw)) {
          message = raw;
        }
      }
      if (resp.metadata) metadata = resp.metadata;
    }

    // Always log 5xx errors for production observability.
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode} - ${error} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorResponse: ErrorApiResponse = {
      success: false,
      error,
      message,
      ...(metadata !== undefined ? { metadata } : {}),
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
    response.status(statusCode).json(errorResponse);
  }
}
