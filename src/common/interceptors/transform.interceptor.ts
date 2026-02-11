import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Global interceptor that wraps all successful responses in the standard envelope:
 * { success: true, data: ..., message: "...", timestamp: "..." }
 *
 * If the controller returns an object with { data, meta }, it preserves the
 * pagination structure: { success: true, data: [...], meta: {...}, timestamp: "..." }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If the response already has a `data` + `meta` shape (paginated results),
        // preserve the meta alongside the envelope.
        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData &&
          'meta' in responseData
        ) {
          return {
            success: true,
            data: responseData.data,
            meta: responseData.meta,
            timestamp: new Date().toISOString(),
          };
        }
        // Standard single-object or array response
        return {
          success: true,
          data: responseData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
