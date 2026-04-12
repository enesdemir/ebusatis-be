import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupplierPortalTokenService } from '../services/supplier-portal-token.service';

/**
 * SupplierTokenGuard (Sprint 11).
 *
 * Validates a long-lived supplier-portal JWT. Token can be supplied
 * via a `:token` URL param or an `x-supplier-token` header. On success
 * it stamps the decoded payload onto `req.supplier` so the controller
 * can filter queries to `partnerId` + `tenantId`.
 */
@Injectable()
export class SupplierTokenGuard implements CanActivate {
  constructor(private readonly tokens: SupplierPortalTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<
        Request & { supplier?: { partnerId: string; tenantId: string } }
      >();
    const token =
      (req.params?.token as string | undefined) ??
      (req.headers['x-supplier-token'] as string | undefined);
    if (!token) throw new UnauthorizedException('SUPPLIER_TOKEN_MISSING');
    try {
      const payload = this.tokens.verify(token);
      req.supplier = { partnerId: payload.sub, tenantId: payload.tenantId };
      return true;
    } catch {
      throw new UnauthorizedException('SUPPLIER_TOKEN_INVALID');
    }
  }
}
