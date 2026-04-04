import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Partner } from '../entities/partner.entity';
import { Counterparty } from '../entities/counterparty.entity';
import { Interaction } from '../entities/interaction.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import { QueryBuilderHelper, PaginatedResponse } from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { CreatePartnerDto, UpdatePartnerDto, CreateCounterpartyDto, CreateInteractionDto } from '../dto/create-partner.dto';

@Injectable()
export class PartnerService {
  constructor(private readonly em: EntityManager) {}

  // ─── Partner CRUD ─────────────────────────────────────────

  async findAll(query: PaginatedQueryDto & { type?: string }): Promise<PaginatedResponse<Partner>> {
    const where: FilterQuery<Partner> = {};
    if (query.type) {
      // JSON array içinde arama: types alanında belirli bir tip var mı?
      where.types = { $contains: query.type };
    }
    return QueryBuilderHelper.paginate(this.em, Partner, query, {
      searchFields: ['name', 'code', 'email', 'phone'],
      defaultSortBy: 'name',
      where,
      populate: ['defaultCurrency'] as any,
    });
  }

  async findOne(id: string): Promise<Partner> {
    const partner = await this.em.findOne(Partner, { id }, {
      populate: ['addresses', 'contacts', 'counterparties', 'assignedReps', 'defaultCurrency', 'tags'] as any,
    });
    if (!partner) throw new NotFoundException(`Partner bulunamadı: ${id}`);
    return partner;
  }

  async create(dto: CreatePartnerDto): Promise<Partner> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new ConflictException('Tenant context bulunamadı');
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const partner = this.em.create(Partner, {
      ...dto,
      tenant,
      defaultCurrency: dto.defaultCurrencyId ? this.em.getReference('Currency', dto.defaultCurrencyId) : undefined,
    } as any);

    await this.em.persistAndFlush(partner);
    return partner;
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    this.em.assign(partner, {
      ...dto,
      defaultCurrency: dto.defaultCurrencyId ? this.em.getReference('Currency', dto.defaultCurrencyId) : partner.defaultCurrency,
    } as any);
    await this.em.flush();
    return partner;
  }

  async remove(id: string): Promise<void> {
    const partner = await this.findOne(id);
    partner.deletedAt = new Date();
    await this.em.flush();
  }

  // ─── Counterparty (Cari Hesap) ────────────────────────────

  async getCounterparties(partnerId: string): Promise<Counterparty[]> {
    return this.em.find(Counterparty, { partner: partnerId, deletedAt: null } as any);
  }

  async createCounterparty(dto: CreateCounterpartyDto): Promise<Counterparty> {
    const tenantId = TenantContext.getTenantId();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const partner = await this.em.findOneOrFail(Partner, { id: dto.partnerId });

    const counterparty = this.em.create(Counterparty, {
      ...dto,
      tenant,
      partner,
    } as any);

    await this.em.persistAndFlush(counterparty);
    return counterparty;
  }

  // ─── Interaction (CRM Etkileşim Logu) ────────────────────

  async getInteractions(partnerId: string): Promise<Interaction[]> {
    return this.em.find(
      Interaction,
      { partner: partnerId, deletedAt: null } as any,
      { orderBy: { createdAt: 'DESC' }, populate: ['createdBy'] as any },
    );
  }

  async createInteraction(dto: CreateInteractionDto, userId: string): Promise<Interaction> {
    const tenantId = TenantContext.getTenantId();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const partner = await this.em.findOneOrFail(Partner, { id: dto.partnerId });
    const user = await this.em.findOneOrFail(User, { id: userId });

    const interaction = this.em.create(Interaction, {
      ...dto,
      tenant,
      partner,
      createdBy: user,
      nextActionDate: dto.nextActionDate ? new Date(dto.nextActionDate) : undefined,
    } as any);

    await this.em.persistAndFlush(interaction);
    return interaction;
  }
}
