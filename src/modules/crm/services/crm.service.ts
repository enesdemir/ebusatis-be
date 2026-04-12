import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Fair, FairStatus } from '../entities/fair.entity';
import { FairParticipant } from '../entities/fair-participant.entity';
import { Lead, LeadStage } from '../entities/lead.entity';
import { LeadSource } from '../entities/lead-source.entity';
import { Partner, PartnerType } from '../../partners/entities/partner.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  EntityNotFoundException,
} from '../../../common/errors/app.exceptions';

@Injectable()
export class CrmService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Fair)
    private readonly fairRepo: EntityRepository<Fair>,
    @InjectRepository(FairParticipant)
    private readonly participantRepo: EntityRepository<FairParticipant>,
    @InjectRepository(Lead)
    private readonly leadRepo: EntityRepository<Lead>,
    @InjectRepository(LeadSource)
    private readonly sourceRepo: EntityRepository<LeadSource>,
    @InjectRepository(Partner)
    private readonly partnerRepo: EntityRepository<Partner>,
  ) {}

  // ── Fair ──

  listFairs() {
    return this.fairRepo.findAll({ orderBy: { startDate: 'DESC' } });
  }

  findFair(id: string) {
    return this.fairRepo
      .findOne({ id }, { populate: ['participants', 'leads'] as never[] })
      .then((f) => {
        if (!f) throw new EntityNotFoundException('Fair', id);
        return f;
      });
  }

  async createFair(data: {
    name: string;
    venue?: string;
    city?: string;
    country?: string;
    startDate: string | Date;
    endDate: string | Date;
    description?: string;
    budget?: number;
    currency?: string;
  }) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const fair = this.fairRepo.create({
      tenant,
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    } as unknown as Fair);
    await this.em.persistAndFlush(fair);
    return fair;
  }

  async updateFairStatus(id: string, status: FairStatus) {
    const fair = await this.findFair(id);
    fair.status = status;
    await this.em.flush();
    return fair;
  }

  async addParticipant(
    fairId: string,
    data: {
      fullName: string;
      company?: string;
      title?: string;
      email?: string;
      phone?: string;
      notes?: string;
    },
  ) {
    const fair = await this.findFair(fairId);
    const participant = this.participantRepo.create({
      tenant: fair.tenant,
      fair,
      ...data,
    } as unknown as FairParticipant);
    await this.em.persistAndFlush(participant);
    return participant;
  }

  // ── Lead ──

  listLeads(stage?: LeadStage) {
    return this.leadRepo.find(stage ? { stage } : {}, {
      populate: ['source', 'fair', 'owner', 'convertedPartner'] as never[],
      orderBy: { createdAt: 'DESC' },
    });
  }

  findLead(id: string) {
    return this.leadRepo
      .findOne(
        { id },
        {
          populate: ['source', 'fair', 'owner', 'convertedPartner'] as never[],
        },
      )
      .then((l) => {
        if (!l) throw new EntityNotFoundException('Lead', id);
        return l;
      });
  }

  async createLead(data: {
    fullName: string;
    company?: string;
    email?: string;
    phone?: string;
    sourceId?: string;
    fairId?: string;
    estimatedValue?: number;
    currency?: string;
    ownerId?: string;
    notes?: string;
  }) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const lead = this.leadRepo.create({
      tenant,
      fullName: data.fullName,
      company: data.company,
      email: data.email,
      phone: data.phone,
      estimatedValue: data.estimatedValue,
      currency: data.currency,
      notes: data.notes,
      source: data.sourceId
        ? this.em.getReference(LeadSource, data.sourceId)
        : undefined,
      fair: data.fairId ? this.em.getReference(Fair, data.fairId) : undefined,
      owner: data.ownerId
        ? this.em.getReference('User', data.ownerId)
        : undefined,
      stage: LeadStage.NEW,
    } as unknown as Lead);
    await this.em.persistAndFlush(lead);
    return lead;
  }

  async moveLeadStage(id: string, stage: LeadStage) {
    const lead = await this.findLead(id);
    lead.stage = stage;
    await this.em.flush();
    return lead;
  }

  /**
   * Convert a lead into a CUSTOMER Partner. Creates the Partner in
   * tenant scope and flips the lead to WON + convertedPartner.
   */
  async convertLeadToPartner(id: string): Promise<Partner> {
    const lead = await this.findLead(id);
    if (lead.convertedPartner) return lead.convertedPartner;
    const partner = this.partnerRepo.create({
      tenant: lead.tenant,
      name: lead.company ?? lead.fullName,
      email: lead.email,
      phone: lead.phone,
      types: [PartnerType.CUSTOMER],
    } as unknown as Partner);
    lead.convertedPartner = partner;
    lead.convertedAt = new Date();
    lead.stage = LeadStage.WON;
    await this.em.persistAndFlush(partner);
    return partner;
  }

  // ── LeadSource ──

  listLeadSources() {
    return this.sourceRepo.find({ isActive: true });
  }

  async createLeadSource(data: { code: string; name: string }) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const source = this.sourceRepo.create({
      tenant,
      ...data,
    } as unknown as LeadSource);
    await this.em.persistAndFlush(source);
    return source;
  }
}
