/**
 * Standardized API response envelope.
 * All endpoints return this shape automatically via the TransformInterceptor.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Paginated API response envelope.
 * Used when the controller returns an object with a `meta` property.
 */
export interface PaginatedApiResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Error API response envelope.
 * Returned by the GlobalExceptionFilter for all error responses.
 *
 * - `error` is a stable error code (e.g. 'TENANT_CONTEXT_MISSING').
 * - `message` is an i18n key (e.g. 'errors.tenant.context_missing').
 * - `metadata` carries optional template variables for interpolation
 *   (e.g. `{ entity: 'Product', id: '...' }`).
 *
 * Frontend interceptor reads `message` and runs `t(message, metadata)`.
 */
export interface ErrorApiResponse {
  success: false;
  error: string;
  message: string;
  metadata?: Record<string, unknown>;
  statusCode: number;
  timestamp: string;
  path: string;
}
