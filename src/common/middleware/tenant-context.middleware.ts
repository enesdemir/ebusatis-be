import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Observable } from 'rxjs';
import { TenantContext } from '../context/tenant.context';

/**
 * x-tenant-id header'ından tenant context'i kurar.
 *
 * MikroORM 6'da global EntityManager üzerinde setFilterParams çağrısı
 * yapılamaz. Bu interceptor kendi RequestContext'ini oluşturarak
 * fork'lanmış bir EM garanti eder ve tenant filter'ını onun üzerine set eder.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private static readonly EMPTY_TENANT = '00000000-0000-0000-0000-000000000000';

  constructor(private readonly orm: MikroORM) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.headers['x-tenant-id'] as string;
    const resolvedTenantId = tenantId || TenantContextInterceptor.EMPTY_TENANT;

    return new Observable((subscriber) => {
      RequestContext.create(this.orm.em, () => {
        const em = RequestContext.getEntityManager()!;
        em.setFilterParams('tenant', { tenantId: resolvedTenantId });
        const run = () => next.handle().subscribe(subscriber);
        if (tenantId) {
          TenantContext.run(tenantId, run);
        } else {
          run();
        }
      });
    });
  }
}
