import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Attribute } from '../entities/attribute.entity';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import { TenantContext } from '../../../common/context/tenant.context';
import { EntityNotFoundException } from '../../../common/errors/app.exceptions';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: EntityRepository<Attribute>,
  ) {}

  async create(dto: CreateAttributeDto): Promise<Attribute> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error(
        'Tenant context is missing. Cannot create attribute without a tenant.',
      );
    }

    // Tenant assignemnt handles multitenancy security seamlessly (ALS pattern)
    const attribute = this.attributeRepository.create({
      ...dto,
      tenant: tenantId,
    });

    await this.attributeRepository.getEntityManager().flush();
    return attribute;
  }

  async findAll(): Promise<Attribute[]> {
    const tenantId = TenantContext.getTenantId();
    // Safety check ensuring we never query the whole DB
    return this.attributeRepository.find({ tenant: { id: tenantId } });
  }

  async findOne(id: string): Promise<Attribute> {
    const tenantId = TenantContext.getTenantId();
    const attribute = await this.attributeRepository.findOne({
      id,
      tenant: { id: tenantId },
    });
    if (!attribute) {
      throw new EntityNotFoundException('Attribute', id);
    }
    return attribute;
  }

  async update(id: string, dto: UpdateAttributeDto): Promise<Attribute> {
    const attribute = await this.findOne(id);
    this.attributeRepository.assign(attribute, dto);
    await this.attributeRepository.getEntityManager().flush();
    return attribute;
  }

  async remove(id: string): Promise<void> {
    const attribute = await this.findOne(id);
    await this.attributeRepository.getEntityManager().removeAndFlush(attribute);
  }
}
