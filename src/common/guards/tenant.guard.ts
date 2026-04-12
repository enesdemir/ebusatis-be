import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';
import { TenantForbiddenException } from '../errors/app.exceptions';

/**
 * Enforces an active tenant context on tenant-scoped endpoints.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, TenantGuard)
 *   @Controller('products')
 *   export class ProductsController { ... }
 *
 * A SuperAdmin in platform mode (without a selected tenant) cannot
 * reach these endpoints — workspace selection must happen first.
 *
 * Error contract: throws TenantForbiddenException so the response
 * carries the stable error code TENANT_FORBIDDEN and the i18n key
 * `errors.tenant.forbidden` for the frontend to translate.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = TenantContext.getTenantId() || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new TenantForbiddenException();
    }

    return true;
  }
}
