import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Partner } from '../entities/partner.entity';
import { PartnerAddress } from '../entities/partner-address.entity';
import { PartnerContact } from '../entities/partner-contact.entity';
import { Counterparty } from '../entities/counterparty.entity';
import { Interaction } from '../entities/interaction.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import { QueryBuilderHelper, PaginatedResponse } from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { ClassificationNode } from '../../classifications/entities/classification-node.entity';
import { CreatePartnerDto, UpdatePartnerDto, CreateAddressDto, CreateContactDto, CreateCounterpartyDto, CreateInteractionDto } from '../dto/create-partner.dto';

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
      populate: ['addresses', 'addresses.country', 'addresses.state', 'addresses.city', 'contacts', 'counterparties', 'assignedReps', 'defaultCurrency', 'tags'] as any,
      populateWhere: { addresses: { deletedAt: null }, contacts: { deletedAt: null }, counterparties: { deletedAt: null } } as any,
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

  // ─── Address ──────────────────────────────────────────────

  async getAddresses(partnerId: string): Promise<PartnerAddress[]> {
    return this.em.find(PartnerAddress, { partner: partnerId, deletedAt: null } as any);
  }

  private resolveAddressRefs(dto: Partial<CreateAddressDto>) {
    const { partnerId, countryId, stateId, cityId, ...rest } = dto;
    const refs: any = { ...rest };
    if (countryId) refs.country = this.em.getReference(ClassificationNode, countryId);
    if (stateId) refs.state = this.em.getReference(ClassificationNode, stateId);
    if (cityId) refs.city = this.em.getReference(ClassificationNode, cityId);
    // null gonderilirse relation'i temizle
    if (countryId === null) refs.country = null;
    if (stateId === null) refs.state = null;
    if (cityId === null) refs.city = null;
    return refs;
  }

  async createAddress(dto: CreateAddressDto): Promise<PartnerAddress> {
    const tenantId = TenantContext.getTenantId();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const partner = await this.em.findOneOrFail(Partner, { id: dto.partnerId });

    const refs = this.resolveAddressRefs(dto);
    const address = this.em.create(PartnerAddress, {
      ...refs,
      tenant,
      partner,
    } as any);

    await this.em.persistAndFlush(address);
    return address;
  }

  async updateAddress(addressId: string, dto: Partial<CreateAddressDto>): Promise<PartnerAddress> {
    const address = await this.em.findOneOrFail(PartnerAddress, { id: addressId, deletedAt: null } as any);
    const refs = this.resolveAddressRefs(dto);
    this.em.assign(address, refs as any);
    await this.em.flush();
    return address;
  }

  async removeAddress(addressId: string): Promise<void> {
    const address = await this.em.findOneOrFail(PartnerAddress, { id: addressId, deletedAt: null } as any);
    address.deletedAt = new Date();
    await this.em.flush();
  }

  // ─── Contact ──────────────────────────────────────────────

  async getContacts(partnerId: string): Promise<PartnerContact[]> {
    return this.em.find(PartnerContact, { partner: partnerId, deletedAt: null } as any);
  }

  async createContact(dto: CreateContactDto): Promise<PartnerContact> {
    const tenantId = TenantContext.getTenantId();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const partner = await this.em.findOneOrFail(Partner, { id: dto.partnerId });

    const contact = this.em.create(PartnerContact, {
      ...dto,
      tenant,
      partner,
    } as any);

    await this.em.persistAndFlush(contact);
    return contact;
  }

  async updateContact(contactId: string, dto: Partial<CreateContactDto>): Promise<PartnerContact> {
    const contact = await this.em.findOneOrFail(PartnerContact, { id: contactId, deletedAt: null } as any);
    const { partnerId, ...updateData } = dto;
    this.em.assign(contact, updateData as any);
    await this.em.flush();
    return contact;
  }

  async removeContact(contactId: string): Promise<void> {
    const contact = await this.em.findOneOrFail(PartnerContact, { id: contactId, deletedAt: null } as any);
    contact.deletedAt = new Date();
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

  async updateCounterparty(counterpartyId: string, dto: Partial<CreateCounterpartyDto>): Promise<Counterparty> {
    const cp = await this.em.findOneOrFail(Counterparty, { id: counterpartyId, deletedAt: null } as any);
    const { partnerId, ...updateData } = dto;
    this.em.assign(cp, updateData as any);
    await this.em.flush();
    return cp;
  }

  async removeCounterparty(counterpartyId: string): Promise<void> {
    const cp = await this.em.findOneOrFail(Counterparty, { id: counterpartyId, deletedAt: null } as any);
    cp.deletedAt = new Date();
    await this.em.flush();
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
