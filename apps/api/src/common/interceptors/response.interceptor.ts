// src/common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If already formatted with success/meta
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Paginated response
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return { success: true, ...data };
        }

        // Standard service response with message/data
        if (
          data &&
          typeof data === 'object' &&
          ('data' in data || 'message' in data)
        ) {
          return { success: true, ...data };
        }

        // Standard success response
        return {
          success: true,
          data: data ?? null,
        };
      }),
    );
  }
}
