import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SupplierPortalTokenService } from '../../auth/services/supplier-portal-token.service';
import { Partner, PartnerType } from '../../partners/entities/partner.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import { TenantContextMissingException } from '../../../common/errors/app.exceptions';

export interface IssuedToken {
  partnerId: string;
  partnerName: string;
  token: string;
  portalUrl: string;
  expiresInDays: number;
}

/**
 * Admin-facing service for issuing / re-issuing supplier portal
 * tokens. Tenant admins call this from the SupplierTokenManagementDialog
 * when onboarding a new supplier or rotating after a leak.
 */
@Injectable()
export class SupplierPortalTokenAdminService {
  constructor(
    private readonly em: EntityManager,
    private readonly tokens: SupplierPortalTokenService,
  ) {}

  async issueForPartner(
    partnerId: string,
    publicBaseUrl: string,
    days = 90,
  ): Promise<IssuedToken> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const partner = await this.em.findOne(Partner, { id: partnerId });
    if (!partner) throw new NotFoundException(`Partner ${partnerId}`);
    if (!partner.types.includes(PartnerType.SUPPLIER)) {
      throw new NotFoundException(`Partner ${partnerId} is not a supplier`);
    }

    const token = this.tokens.issue(partnerId, tenantId, partner.email, days);
    const portalUrl = `${publicBaseUrl.replace(/\/$/, '')}/supplier/track/${token}`;
    return {
      partnerId,
      partnerName: partner.name,
      token,
      portalUrl,
      expiresInDays: days,
    };
  }
}
