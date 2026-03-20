import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant.context';

/**
 * This middleware intercepts incoming HTTP requests, extracts the 'x-tenant-id' header,
 * and sets it into the AsyncLocalStorage (TenantContext) for the duration of the request.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    // Check if the route explicitly requires a tenant context.
    // In a real application, you might bypass this for auth routes.
    if (!tenantId) {
      // If it's the admin panel or global settings, we might allow it,
      // but for domain endpoints, this header is mandatory.
      console.warn(`[TenantContextMiddleware] Missing x-tenant-id for route: ${req.url}`);
      return next(); // Temporarily letting it pass until fully integrated across all routes.
    }

    // TODO: Ideally, query the DB here (or via a Guard) to ensure req.user has access to the requested tenantId.
    // e.g. const hasAccess = await this.userTenantService.verify(req.user.id, tenantId);

    // Run the rest of the application cycle inside the TenantContext
    TenantContext.run(tenantId, () => {
      next();
    });
  }
}
