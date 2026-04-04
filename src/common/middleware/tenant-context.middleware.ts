import { Injectable, NestMiddleware } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant.context';

/**
 * Gelen HTTP isteğinden x-tenant-id header'ını alır ve iki mekanizmaya set eder:
 *
 * 1. AsyncLocalStorage (TenantContext) → Service katmanında TenantContext.getTenantId() ile erişim
 * 2. MikroORM EntityManager filter params → Otomatik WHERE tenant_id = :tenantId filtresi
 *
 * Bu sayede tenant izolasyonu hem manuel (defense-in-depth) hem otomatik (MikroORM filter) olarak sağlanır.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly em: EntityManager) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      // Platform-scoped endpoint'ler (admin panel, auth) tenant header'sız çalışabilir.
      // Tenant-scoped endpoint'ler TenantGuard ile korunacak.
      return next();
    }

    // MikroORM EntityManager'e tenant filter parametresini set et.
    // Bu sayede @Filter('tenant') olan tüm entity sorgularına otomatik WHERE eklenir.
    this.em.setFilterParams('tenant', { tenantId });

    // AsyncLocalStorage'a da set et (service katmanında manual kontrol için).
    TenantContext.run(tenantId, () => {
      next();
    });
  }
}
