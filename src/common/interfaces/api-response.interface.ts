/**
 * Standardized API response envelope.
 * All endpoints return this shape automatically via the TransformInterceptor.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Paginated API response envelope.
 * Used when the controller returns an object with a `meta` property.
 */
export interface PaginatedApiResponse<T = any> {
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
 */
export interface ErrorApiResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
}
