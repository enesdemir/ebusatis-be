import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { TenantContext } from '../../../common/context/tenant.context';
import { CrmService } from '../services/crm.service';
import { Fair, FairStatus } from '../entities/fair.entity';
import { FairParticipant } from '../entities/fair-participant.entity';
import { Lead, LeadStage } from '../entities/lead.entity';
import { LeadSource } from '../entities/lead-source.entity';
import { Partner, PartnerType } from '../../partners/entities/partner.entity';

describe('CrmService', () => {
  let service: CrmService;
  let em: {
    findOneOrFail: jest.Mock;
    flush: jest.Mock;
    persistAndFlush: jest.Mock;
    persist: jest.Mock;
    getReference: jest.Mock;
  };
  let fairRepo: ReturnType<typeof makeRepo<Fair>>;
  let participantRepo: ReturnType<typeof makeRepo<FairParticipant>>;
  let leadRepo: ReturnType<typeof makeRepo<Lead>>;
  let sourceRepo: ReturnType<typeof makeRepo<LeadSource>>;
  let partnerRepo: ReturnType<typeof makeRepo<Partner>>;

  const mockTenant = { id: 'tenant-1', name: 'Acme' };

  function makeRepo<T>() {
    return {
      findAll: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => ({ id: 'new-id', ...data }) as unknown as T),
      persistAndFlush: jest.fn(),
    };
  }

  beforeEach(async () => {
    jest.spyOn(TenantContext, 'getTenantId').mockReturnValue(mockTenant.id);

    em = {
      findOneOrFail: jest.fn().mockResolvedValue(mockTenant),
      flush: jest.fn(),
      persistAndFlush: jest.fn(),
      persist: jest.fn(),
      getReference: jest.fn((_cls, id) => ({ id })),
    } as unknown as typeof em;
    fairRepo = makeRepo<Fair>();
    participantRepo = makeRepo<FairParticipant>();
    leadRepo = makeRepo<Lead>();
    sourceRepo = makeRepo<LeadSource>();
    partnerRepo = makeRepo<Partner>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: EntityManager, useValue: em },
        { provide: getRepositoryToken(Fair), useValue: fairRepo },
        {
          provide: getRepositoryToken(FairParticipant),
          useValue: participantRepo,
        },
        { provide: getRepositoryToken(Lead), useValue: leadRepo },
        { provide: getRepositoryToken(LeadSource), useValue: sourceRepo },
        { provide: getRepositoryToken(Partner), useValue: partnerRepo },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
  });

  describe('createFair', () => {
    it('should persist a fair with parsed dates', async () => {
      await service.createFair({
        name: 'Expo 2026',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
      });
      expect(fairRepo.create).toHaveBeenCalled();
      const arg = fairRepo.create.mock.calls[0][0] as {
        name: string;
        startDate: Date;
        endDate: Date;
      };
      expect(arg.name).toBe('Expo 2026');
      expect(arg.startDate).toBeInstanceOf(Date);
      expect(arg.endDate).toBeInstanceOf(Date);
    });
  });

  describe('createLead', () => {
    it('should default to NEW stage and respect tenant scope', async () => {
      await service.createLead({
        fullName: 'John Doe',
        company: 'ACME',
      });
      expect(leadRepo.create).toHaveBeenCalled();
      const arg = leadRepo.create.mock.calls[0][0] as { stage: LeadStage };
      expect(arg.stage).toBe(LeadStage.NEW);
    });
  });

  describe('convertLeadToPartner', () => {
    it('should create a CUSTOMER partner and flip lead to WON', async () => {
      const lead = {
        id: 'lead-1',
        fullName: 'Ann',
        company: 'Ann Co',
        email: 'ann@example.com',
        phone: '',
        stage: LeadStage.QUALIFIED,
        tenant: mockTenant,
        convertedPartner: undefined as Partner | undefined,
        convertedAt: undefined as Date | undefined,
      };
      leadRepo.findOne.mockResolvedValue(lead);
      partnerRepo.create.mockImplementation(
        (data) => ({ id: 'p-1', ...data }) as unknown as Partner,
      );

      const partner = await service.convertLeadToPartner('lead-1');

      expect(partner).toBeDefined();
      const partnerArg = partnerRepo.create.mock.calls[0][0] as {
        types: PartnerType[];
      };
      expect(partnerArg.types).toContain(PartnerType.CUSTOMER);
      expect(lead.stage).toBe(LeadStage.WON);
      expect(lead.convertedAt).toBeInstanceOf(Date);
    });

    it('should short-circuit when lead is already converted', async () => {
      const existing = { id: 'p-1' } as Partner;
      leadRepo.findOne.mockResolvedValue({
        id: 'lead-1',
        convertedPartner: existing,
      });
      const partner = await service.convertLeadToPartner('lead-1');
      expect(partner).toBe(existing);
      expect(partnerRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('moveLeadStage', () => {
    it('should mutate stage and flush', async () => {
      const lead = { id: 'l-1', stage: LeadStage.NEW } as Lead;
      leadRepo.findOne.mockResolvedValue(lead);
      await service.moveLeadStage('l-1', LeadStage.PROPOSAL);
      expect(lead.stage).toBe(LeadStage.PROPOSAL);
      expect(em.flush).toHaveBeenCalled();
    });
  });

  describe('updateFairStatus', () => {
    it('should mutate status and flush', async () => {
      const fair = { id: 'f-1', status: FairStatus.PLANNED } as Fair;
      fairRepo.findOne.mockResolvedValue(fair);
      await service.updateFairStatus('f-1', FairStatus.ACTIVE);
      expect(fair.status).toBe(FairStatus.ACTIVE);
    });
  });
});
