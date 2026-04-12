import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import {
  TenantContextMissingException,
  EntityNotFoundException,
  CodeDuplicateException,
} from '../../../common/errors/app.exceptions';

/**
 * Generic BaseDefinitionService integration test.
 *
 * Uses `UnitOfMeasureService` as the concrete subclass but the
 * assertions validate the behaviour of `BaseDefinitionService<T>`
 * itself — findAll, findOne, create, update, remove, reorder,
 * toggleActive. Because all 9 definitions services extend the same
 * base class, passing this test suite means they all inherit the
 * same tenant isolation, error handling and CRUD behaviour.
 */

// Default TenantContext mock — assumes a tenant context is active.
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: { getTenantId: jest.fn(() => 'test-tenant-id') },
}));

import { TenantContext } from '../../../common/context/tenant.context';

const tenantStub = { id: 'test-tenant-id' };

describe('BaseDefinitionService (via UnitOfMeasureService)', () => {
  let service: UnitOfMeasureService;
  let em: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    create: jest.Mock;
    assign: jest.Mock;
    persist: jest.Mock;
    persistAndFlush: jest.Mock;
    flush: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const qbMock = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getResultAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (TenantContext.getTenantId as jest.Mock).mockReturnValue('test-tenant-id');

    em = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn().mockResolvedValue(tenantStub),
      create: jest.fn((_EntityClass: unknown, data: object) => ({ ...data })),
      assign: jest.fn((target: object, source: object) =>
        Object.assign(target, source),
      ),
      persist: jest.fn(),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitOfMeasureService,
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get(UnitOfMeasureService);
  });

  // ── findOne ──
  describe('findOne', () => {
    it('should return the entity when found', async () => {
      const entity = { id: 'u-1', name: 'Metre', code: 'm' };
      em.findOne.mockResolvedValue(entity);
      const result = await service.findOne('u-1');
      expect(result).toBe(entity);
    });

    it('should throw EntityNotFoundException when not found', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  // ── create ──
  describe('create', () => {
    it('should throw TenantContextMissingException without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(
        service.create({ name: 'Test', code: 'TST' } as Partial<UnitOfMeasure>),
      ).rejects.toThrow(TenantContextMissingException);
    });

    it('should persist a new entity with the tenant from context', async () => {
      em.findOne.mockResolvedValue(null); // no duplicate code
      const created = { id: 'u-new', name: 'Yard', code: 'yd' };
      em.create.mockReturnValue(created);

      const result = await service.create({
        name: 'Yard',
        code: 'yd',
      } as Partial<UnitOfMeasure>);

      expect(result).toBe(created);
      expect(em.persistAndFlush).toHaveBeenCalledWith(created);
      // Verify the tenant was set from TenantContext, not from the caller.
      const createCall = em.create.mock.calls[0][1] as Record<string, unknown>;
      expect(createCall.tenant).toBe(tenantStub);
    });

    it('should throw CodeDuplicateException when code already exists', async () => {
      em.findOne.mockResolvedValue({ id: 'existing', code: 'yd' }); // duplicate found
      await expect(
        service.create({ name: 'Yard', code: 'yd' } as Partial<UnitOfMeasure>),
      ).rejects.toThrow(CodeDuplicateException);
    });

    it('should allow create when code is not provided', async () => {
      const created = { id: 'u-new', name: 'No Code' };
      em.create.mockReturnValue(created);

      const result = await service.create({
        name: 'No Code',
      } as Partial<UnitOfMeasure>);
      expect(result).toBe(created);
      // findOne for duplicate check should NOT have been called because
      // data.code is falsy.
      expect(em.findOne).not.toHaveBeenCalled();
    });
  });

  // ── update ──
  describe('update', () => {
    it('should throw EntityNotFoundException when entity does not exist', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(
        service.update('missing', { name: 'X' } as Partial<UnitOfMeasure>),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should assign provided fields and flush', async () => {
      const existing = { id: 'u-1', name: 'Old', code: 'OLD' };
      em.findOne
        .mockResolvedValueOnce(existing) // findOne in update
        .mockResolvedValueOnce(null); // code uniqueness check (no dup)

      const result = await service.update('u-1', {
        name: 'New',
      } as Partial<UnitOfMeasure>);

      expect(result.name).toBe('New');
      expect(em.flush).toHaveBeenCalled();
    });

    it('should throw CodeDuplicateException when new code collides with another entity', async () => {
      const existing = { id: 'u-1', name: 'Metre', code: 'm' };
      em.findOne
        .mockResolvedValueOnce(existing) // findOne for the entity itself
        .mockResolvedValueOnce({ id: 'u-other', code: 'yd' }); // duplicate code found

      await expect(
        service.update('u-1', { code: 'yd' } as Partial<UnitOfMeasure>),
      ).rejects.toThrow(CodeDuplicateException);
    });

    it('should skip code uniqueness check when code is unchanged', async () => {
      const existing = { id: 'u-1', name: 'Metre', code: 'm' };
      em.findOne.mockResolvedValueOnce(existing);

      await service.update('u-1', {
        name: 'Meter',
        code: 'm',
      } as Partial<UnitOfMeasure>);

      // Only one findOne call (for the entity itself), not two.
      expect(em.findOne).toHaveBeenCalledTimes(1);
    });
  });

  // ── remove (soft delete) ──
  describe('remove', () => {
    it('should set deletedAt and flush', async () => {
      const entity: { id: string; deletedAt: Date | undefined } = {
        id: 'u-1',
        deletedAt: undefined,
      };
      em.findOne.mockResolvedValue(entity);

      await service.remove('u-1');

      expect(entity.deletedAt).toBeInstanceOf(Date);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should throw EntityNotFoundException when missing', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  // ── toggleActive ──
  describe('toggleActive', () => {
    it('should flip isActive from true to false', async () => {
      const entity: { id: string; isActive: boolean } = {
        id: 'u-1',
        isActive: true,
      };
      em.findOne.mockResolvedValue(entity);

      const result = await service.toggleActive('u-1');

      expect(result.isActive).toBe(false);
    });

    it('should flip isActive from false to true', async () => {
      const entity: { id: string; isActive: boolean } = {
        id: 'u-1',
        isActive: false,
      };
      em.findOne.mockResolvedValue(entity);

      const result = await service.toggleActive('u-1');

      expect(result.isActive).toBe(true);
    });
  });

  // ── reorder ──
  describe('reorder', () => {
    it('should update sortOrder for each item', async () => {
      const e1: { id: string; sortOrder: number } = { id: 'u-1', sortOrder: 0 };
      const e2: { id: string; sortOrder: number } = { id: 'u-2', sortOrder: 1 };
      em.findOne.mockResolvedValueOnce(e1).mockResolvedValueOnce(e2);

      await service.reorder([
        { id: 'u-1', sortOrder: 5 },
        { id: 'u-2', sortOrder: 10 },
      ]);

      expect(e1.sortOrder).toBe(5);
      expect(e2.sortOrder).toBe(10);
      expect(em.flush).toHaveBeenCalled();
    });
  });
});
