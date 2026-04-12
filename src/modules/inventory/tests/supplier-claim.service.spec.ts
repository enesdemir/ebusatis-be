import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { SupplierClaimService } from '../services/supplier-claim.service';
import { ClaimStatus, ClaimType } from '../entities/supplier-claim.entity';
import { DiscrepancyType } from '../entities/goods-receive-line.entity';
import { OpenSupplierClaimDto } from '../dto/open-supplier-claim.dto';
import { UpdateSupplierClaimDto } from '../dto/update-supplier-claim.dto';
import {
  TenantContextMissingException,
  SupplierClaimNotFoundException,
  GoodsReceiveLineNotFoundException,
  SupplierClaimNoDiscrepancyException,
  SupplierClaimAlreadyOpenException,
} from '../../../common/errors/app.exceptions';

// Default TenantContext mock — assumes a tenant context is active.
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: { getTenantId: jest.fn(() => 'test-tenant-id') },
}));

import { TenantContext } from '../../../common/context/tenant.context';

const tenantStub = { id: 'test-tenant-id' };

describe('SupplierClaimService', () => {
  let service: SupplierClaimService;
  let em: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    create: jest.Mock;
    persist: jest.Mock;
    persistAndFlush: jest.Mock;
    flush: jest.Mock;
    count: jest.Mock;
    getReference: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (TenantContext.getTenantId as jest.Mock).mockReturnValue('test-tenant-id');

    em = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn().mockResolvedValue(tenantStub),
      create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
      persist: jest.fn(),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
      getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierClaimService,
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get(SupplierClaimService);
  });

  // ── findOne ──
  describe('findOne', () => {
    it('should throw SupplierClaimNotFoundException when missing', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        SupplierClaimNotFoundException,
      );
    });
  });

  // ── open ──
  describe('open', () => {
    const baseDto = {
      goodsReceiveId: 'gr-1',
      claimType: ClaimType.DAMAGED,
      description: 'Three rolls arrived wet.',
      lines: [
        {
          goodsReceiveLineId: 'grl-1',
          affectedQuantity: 3,
          unitPrice: 100,
        },
      ],
    } as unknown as OpenSupplierClaimDto;

    it('should throw without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(service.open(baseDto, 'user-1')).rejects.toThrow(
        TenantContextMissingException,
      );
    });

    it('should throw when goods receive is missing', async () => {
      em.findOne.mockResolvedValueOnce(null); // first call: goods receive
      await expect(service.open(baseDto, 'user-1')).rejects.toThrow(
        SupplierClaimNotFoundException,
      );
    });

    it('should throw GoodsReceiveLineNotFoundException when line is missing', async () => {
      em.findOne
        .mockResolvedValueOnce({
          id: 'gr-1',
          supplier: { id: 'sup-1' },
          purchaseOrder: { id: 'po-1' },
        }) // goods receive
        .mockResolvedValueOnce(null); // line lookup
      await expect(service.open(baseDto, 'user-1')).rejects.toThrow(
        GoodsReceiveLineNotFoundException,
      );
    });

    it('should reject lines without a discrepancy', async () => {
      em.findOne
        .mockResolvedValueOnce({
          id: 'gr-1',
          supplier: { id: 'sup-1' },
          purchaseOrder: { id: 'po-1' },
        })
        .mockResolvedValueOnce({
          id: 'grl-1',
          discrepancyType: DiscrepancyType.NONE,
          claim: undefined,
          variant: { id: 'var-1' },
        });
      await expect(service.open(baseDto, 'user-1')).rejects.toThrow(
        SupplierClaimNoDiscrepancyException,
      );
    });

    it('should reject lines that already have an open claim', async () => {
      em.findOne
        .mockResolvedValueOnce({
          id: 'gr-1',
          supplier: { id: 'sup-1' },
          purchaseOrder: { id: 'po-1' },
        })
        .mockResolvedValueOnce({
          id: 'grl-1',
          discrepancyType: DiscrepancyType.DAMAGED,
          claim: { id: 'existing-claim' },
          variant: { id: 'var-1' },
        });
      await expect(service.open(baseDto, 'user-1')).rejects.toThrow(
        SupplierClaimAlreadyOpenException,
      );
    });

    it('should compute claim totals from line items', async () => {
      const grLine = {
        id: 'grl-1',
        discrepancyType: DiscrepancyType.DAMAGED,
        claim: undefined,
        variant: { id: 'var-1' },
      };
      em.findOne
        .mockResolvedValueOnce({
          id: 'gr-1',
          supplier: { id: 'sup-1' },
          purchaseOrder: { id: 'po-1' },
        })
        .mockResolvedValueOnce(grLine);
      em.count.mockResolvedValue(0);

      const claimResult = { id: 'claim-1' };
      em.create
        .mockReturnValueOnce(claimResult) // claim
        .mockReturnValueOnce({ id: 'cl-1' }); // claim line

      await service.open(baseDto, 'user-1');

      const claimPayload = em.create.mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(claimPayload.claimNumber).toMatch(/^CLM-\d{4}-0001$/);
      expect(claimPayload.claimedAmount).toBe(300); // 3 * 100
      expect(claimPayload.status).toBe(ClaimStatus.OPEN);
      // Goods receive line claim pointer should be set so the round-trip lookup works.
      expect((grLine as Record<string, unknown>).claim).toBe(claimResult);
    });
  });

  // ── update ──
  describe('update', () => {
    it('should stamp resolvedAt when transitioning to RESOLVED_CREDIT', async () => {
      const claim: {
        id: string;
        status: ClaimStatus;
        settledAmount?: number;
        resolvedAt?: Date;
      } = {
        id: 'claim-1',
        status: ClaimStatus.OPEN,
        resolvedAt: undefined,
      };
      em.findOne.mockResolvedValue(claim);

      await service.update('claim-1', {
        status: ClaimStatus.RESOLVED_CREDIT,
        settledAmount: 300,
      } as unknown as UpdateSupplierClaimDto);

      expect(claim.status).toBe(ClaimStatus.RESOLVED_CREDIT);
      expect(claim.settledAmount).toBe(300);
      expect(claim.resolvedAt).toBeInstanceOf(Date);
    });

    it('should not overwrite resolvedAt if already set', async () => {
      const existing = new Date('2026-01-01');
      const claim: {
        id: string;
        status: ClaimStatus;
        resolvedAt: Date;
      } = {
        id: 'claim-1',
        status: ClaimStatus.NEGOTIATING,
        resolvedAt: existing,
      };
      em.findOne.mockResolvedValue(claim);

      await service.update('claim-1', {
        status: ClaimStatus.RESOLVED_REPLACEMENT,
      } as unknown as UpdateSupplierClaimDto);

      expect(claim.resolvedAt).toBe(existing);
    });

    it('should NOT stamp resolvedAt for non-resolving transitions', async () => {
      const claim: {
        id: string;
        status: ClaimStatus;
        resolvedAt?: Date;
      } = {
        id: 'claim-1',
        status: ClaimStatus.OPEN,
        resolvedAt: undefined,
      };
      em.findOne.mockResolvedValue(claim);

      await service.update('claim-1', {
        status: ClaimStatus.NEGOTIATING,
      } as unknown as UpdateSupplierClaimDto);

      expect(claim.status).toBe(ClaimStatus.NEGOTIATING);
      expect(claim.resolvedAt).toBeUndefined();
    });
  });
});
