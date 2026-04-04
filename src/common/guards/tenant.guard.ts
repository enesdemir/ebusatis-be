import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';

/**
 * Tenant-scoped endpoint'lerde aktif bir tenant context'i zorunlu kılar.
 *
 * Kullanım:
 *   @UseGuards(JwtAuthGuard, TenantGuard)
 *   @Controller('products')
 *   export class ProductsController { ... }
 *
 * SuperAdmin platform modunda (tenant seçmeden) bu endpoint'lere erişemez.
 * Önce workspace seçimi yapmalıdır.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = TenantContext.getTenantId() || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException(
        'Bu işlem için bir çalışma alanı (tenant) seçilmiş olmalıdır. Lütfen önce workspace seçimi yapın.',
      );
    }

    return true;
  }
}
