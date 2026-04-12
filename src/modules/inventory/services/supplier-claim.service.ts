import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  GoodsReceiveLineNotFoundException,
  SupplierClaimNotFoundException,
  SupplierClaimNoDiscrepancyException,
  SupplierClaimAlreadyOpenException,
} from '../../../common/errors/app.exceptions';
import { QueryBuilderHelper, PaginatedResponse } from '../../../common/helpers/query-builder.helper';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { User } from '../../users/entities/user.entity';
import {
  SupplierClaim,
  ClaimStatus,
} from '../entities/supplier-claim.entity';
import { SupplierClaimLine } from '../entities/supplier-claim-line.entity';
import {
  GoodsReceiveLine,
  DiscrepancyType,
} from '../entities/goods-receive-line.entity';
import { GoodsReceive } from '../entities/goods-receive.entity';
import { OpenSupplierClaimDto } from '../dto/open-supplier-claim.dto';
import { UpdateSupplierClaimDto } from '../dto/update-supplier-claim.dto';
import { SupplierClaimQueryDto } from '../dto/supplier-claim-query.dto';

/**
 * Supplier Claim service.
 *
 * Owns the discrepancy → claim → settlement workflow on the import
 * side. Claims can only be opened against goods receive lines that
 * already carry a discrepancy, and the same line cannot have two
 * concurrent claims.
 *
 * Multi-tenant: BaseTenantEntity filter + manual TenantContext check.
 * Error contract: every failure path throws a custom AppException.
 */
@Injectable()
export class SupplierClaimService {
  constructor(private readonly em: EntityManager) {}

  // ── Read ──

  async findAll(query: SupplierClaimQueryDto): Promise<PaginatedResponse<SupplierClaim>> {
    return QueryBuilderHelper.paginate(this.em, SupplierClaim, query, {
      searchFields: ['claimNumber', 'description'],
      defaultSortBy: 'openedAt',
      populate: ['supplier', 'goodsReceive', 'purchaseOrder', 'currency'] as any,
    });
  }

  async findOne(id: string): Promise<SupplierClaim> {
    const claim = await this.em.findOne(
      SupplierClaim,
      { id },
      {
        populate: [
          'supplier',
          'goodsReceive',
          'purchaseOrder',
          'currency',
          'openedBy',
          'lines',
          'lines.variant',
          'lines.goodsReceiveLine',
        ] as any,
      },
    );
    if (!claim) throw new SupplierClaimNotFoundException(id);
    return claim;
  }

  /**
   * Open a supplier claim against a goods receive.
   *
   * Validation rules enforced here:
   *  - Tenant context is required.
   *  - Every referenced goods receive line must exist and must already
   *    have a discrepancy flagged on it.
   *  - The same goods receive line cannot have two concurrent claims.
   *
   * On success the new claim is persisted with one `SupplierClaimLine`
   * per affected variant and each goods receive line gets its `claim`
   * pointer updated so the round-trip lookup works.
   */
  async open(dto: OpenSupplierClaimDto, userId: string): Promise<SupplierClaim> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const goodsReceive = await this.em.findOne(
      GoodsReceive,
      { id: dto.goodsReceiveId },
      { populate: ['supplier', 'purchaseOrder'] as any },
    );
    if (!goodsReceive) {
      // Surface a non-finding here so the caller doesn't see a generic
      // 500 from a downstream `findOneOrFail`.
      throw new SupplierClaimNotFoundException(dto.goodsReceiveId);
    }

    // Validate every referenced goods receive line up front.
    const grLines = new Map<string, GoodsReceiveLine>();
    for (const lineDto of dto.lines) {
      const grLine = await this.em.findOne(
        GoodsReceiveLine,
        { id: lineDto.goodsReceiveLineId },
        { populate: ['claim'] as any },
      );
      if (!grLine) {
        throw new GoodsReceiveLineNotFoundException(lineDto.goodsReceiveLineId);
      }
      if (grLine.discrepancyType === DiscrepancyType.NONE) {
        throw new SupplierClaimNoDiscrepancyException(lineDto.goodsReceiveLineId);
      }
      if (grLine.claim) {
        throw new SupplierClaimAlreadyOpenException(
          lineDto.goodsReceiveLineId,
          (grLine.claim as any).id,
        );
      }
      grLines.set(lineDto.goodsReceiveLineId, grLine);
    }

    // Tenant-scoped sequence number for the claim.
    const count = await this.em.count(SupplierClaim, { tenant: tenantId } as any);
    const claimNumber = `CLM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Total claimed amount = sum of (affectedQuantity * unitPrice) over the lines.
    const claimedAmount = dto.lines.reduce(
      (sum, l) => sum + l.affectedQuantity * l.unitPrice,
      0,
    );

    const claim = this.em.create(SupplierClaim, {
      tenant,
      claimNumber,
      supplier: (goodsReceive.supplier as any),
      goodsReceive,
      purchaseOrder: (goodsReceive.purchaseOrder as any),
      claimType: dto.claimType,
      status: ClaimStatus.OPEN,
      claimedAmount,
      currency: dto.currencyId
        ? this.em.getReference(Currency, dto.currencyId)
        : undefined,
      description: dto.description,
      photoUrls: dto.photoUrls,
      openedAt: new Date(),
      openedBy: this.em.getReference(User, userId),
    } as any);
    this.em.persist(claim);

    for (const lineDto of dto.lines) {
      const grLine = grLines.get(lineDto.goodsReceiveLineId);
      if (!grLine) continue;

      const claimLine = this.em.create(SupplierClaimLine, {
        tenant,
        claim,
        goodsReceiveLine: grLine,
        variant: (grLine.variant as any),
        affectedQuantity: lineDto.affectedQuantity,
        unitPrice: lineDto.unitPrice,
        lineTotal: round2(lineDto.affectedQuantity * lineDto.unitPrice),
        note: lineDto.note,
      } as any);
      this.em.persist(claimLine);

      // Round-trip pointer so the goods receive UI can show the claim.
      grLine.claim = claim;
    }

    await this.em.flush();
    return claim;
  }

  /**
   * Update an existing supplier claim. Status transitions to a
   * resolved / rejected / closed state automatically stamp `resolvedAt`.
   */
  async update(id: string, dto: UpdateSupplierClaimDto): Promise<SupplierClaim> {
    const claim = await this.findOne(id);

    if (dto.status !== undefined) {
      claim.status = dto.status;
      const isResolved =
        dto.status === ClaimStatus.RESOLVED_CREDIT ||
        dto.status === ClaimStatus.RESOLVED_REPLACEMENT ||
        dto.status === ClaimStatus.RESOLVED_REFUND ||
        dto.status === ClaimStatus.REJECTED ||
        dto.status === ClaimStatus.CLOSED;
      if (isResolved && !claim.resolvedAt) {
        claim.resolvedAt = new Date();
      }
    }
    if (dto.settledAmount !== undefined) claim.settledAmount = dto.settledAmount;
    if (dto.description !== undefined) claim.description = dto.description;
    if (dto.photoUrls !== undefined) claim.photoUrls = dto.photoUrls;

    await this.em.flush();
    return claim;
  }
}

// ── Local helpers ──

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
