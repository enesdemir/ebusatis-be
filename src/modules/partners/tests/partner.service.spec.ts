import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { PartnerService } from '../services/partner.service';
import { CreatePartnerDto } from '../dto/create-partner.dto';
import { UpdatePartnerDto } from '../dto/create-partner.dto';

// EntityManager mock — tum metotlar
const mockEm = {
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn().mockResolvedValue([[{ id: '1', name: 'Test' }], 1]),
  count: jest.fn(),
  create: jest.fn(),
  persist: jest.fn(),
  persistAndFlush: jest.fn(),
  flush: jest.fn(),
  findOneOrFail: jest.fn().mockResolvedValue({ id: 'test-tenant-id' }),
  assign: jest.fn((target: object, source: object) =>
    Object.assign(target, source),
  ),
  getReference: jest.fn(),
  fork: jest.fn().mockReturnThis(),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getResultAndCount: jest.fn().mockResolvedValue([[], 0]),
  }),
};

// TenantContext mock
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: { getTenantId: () => 'test-tenant-id' },
}));

describe('PartnerService', () => {
  let service: PartnerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartnerService, { provide: EntityManager, useValue: mockEm }],
    }).compile();
    service = module.get(PartnerService);
  });

  describe('findAll', () => {
    it('should return paginated result', async () => {
      mockEm.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getResultAndCount: jest
          .fn()
          .mockResolvedValue([[{ id: '1', name: 'ABC' }], 1]),
      });
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return partner when found', async () => {
      mockEm.findOne.mockResolvedValue({ id: '1', name: 'Test Partner' });
      const result = await service.findOne('1');
      expect(result.name).toBe('Test Partner');
    });

    it('should throw when not found', async () => {
      mockEm.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create and persist partner', async () => {
      const created = { id: '1', name: 'New Partner', types: ['CUSTOMER'] };
      mockEm.create.mockReturnValue(created);
      mockEm.persistAndFlush.mockResolvedValue(undefined);
      const result = await service.create({
        name: 'New Partner',
        types: ['CUSTOMER'],
      } as unknown as CreatePartnerDto);
      expect(result.name).toBe('New Partner');
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update partner fields', async () => {
      const existing = { id: '1', name: 'Old Name', phone: null };
      mockEm.findOne.mockResolvedValue(existing);
      mockEm.flush.mockResolvedValue(undefined);
      const result = await service.update('1', {
        name: 'Updated Name',
      } as unknown as UpdatePartnerDto);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should soft-delete partner', async () => {
      const partner = { id: '1', deletedAt: null };
      mockEm.findOne.mockResolvedValue(partner);
      mockEm.flush.mockResolvedValue(undefined);
      await service.remove('1');
      expect(partner.deletedAt).toBeDefined();
    });

    it('should throw when partner not found', async () => {
      mockEm.findOne.mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toThrow();
    });
  });
});
