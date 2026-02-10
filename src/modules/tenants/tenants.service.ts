import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, wrap } from '@mikro-orm/postgresql';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: EntityRepository<Tenant>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({ domain: createTenantDto.domain });
    if (existing) {
      throw new ConflictException(`Tenant with domain '${createTenantDto.domain}' already exists.`);
    }

    const em = this.tenantRepository.getEntityManager();
    const tenant = new Tenant(createTenantDto.name, createTenantDto.domain);
    if (createTenantDto.type) {
      tenant.type = createTenantDto.type;
    }

    await em.persistAndFlush(tenant);

    // Create Admin User
    const password = createTenantDto.adminPassword || 'Start123!';
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminUser = new User(createTenantDto.adminEmail, tenant);
    adminUser.passwordHash = hashedPassword;
    adminUser.isTenantOwner = true;
    adminUser.locale = 'tr'; // Default locale

    await em.persistAndFlush(adminUser);
    
    return tenant;
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.findAll({ orderBy: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ id }, { populate: ['users'] });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found.`);
    }
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    wrap(tenant).assign(updateTenantDto);
    
    await this.tenantRepository.getEntityManager().flush();
    return tenant;
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    // Soft delete logic can be applied here if entity supports it logic, base entity has deletedAt
    // But for now let's stick to true deletion or soft delete if BaseEntity is handled by GlobalFilter
    // Tenant extends BaseEntity which has deletedAt. 
    // MikroORM usually needs manual soft delete implementation or Filter.
    // For now, let's just set deletedAt.
    
    tenant.deletedAt = new Date();
    await this.tenantRepository.getEntityManager().flush();
  }
}
