import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, FilterQuery, wrap } from '@mikro-orm/postgresql';
import { Tenant, SubscriptionStatus } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

/** Query parameters for tenant listing */
interface TenantQueryInput {
  search?: string;
  status?: SubscriptionStatus;
  type?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: EntityRepository<Tenant>,
  ) {}

  /**
   * Creates a new tenant with an admin user.
   */
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
    adminUser.locale = 'tr';
    await em.persistAndFlush(adminUser);
    return tenant;
  }

  /**
   * Lists tenants with search, filter, sort, and pagination.
   */
  async findAll(query?: TenantQueryInput) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: FilterQuery<Tenant> = {};
    if (query?.search) {
      where.$or = [
        { name: { $like: `%${query.search}%` } },
        { domain: { $like: `%${query.search}%` } },
      ];
    }
    if (query?.status) {
      where.subscriptionStatus = query.status;
    }
    if (query?.type) {
      where.type = query.type as any;
    }
    const sortBy = query?.sortBy || 'createdAt';
    const sortOrder = query?.sortOrder || 'DESC';
    const [data, total] = await this.tenantRepository.findAndCount(where, {
      populate: ['users'],
      orderBy: { [sortBy]: sortOrder },
      limit,
      offset,
    });
    return {
      data: data.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        type: tenant.type,
        subscriptionStatus: tenant.subscriptionStatus,
        features: tenant.features,
        userCount: tenant.users.count(),
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single tenant by ID with populated relations.
   */
  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ id }, { populate: ['users'] });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found.`);
    }
    return tenant;
  }

  /**
   * Returns statistics for a specific tenant.
   */
  async getStatistics(id: string) {
    const tenant = await this.findOne(id);
    const users = tenant.users.getItems();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);
    const activeUserCount = users.filter(
      (u: any) => u.lastLoginAt && u.lastLoginAt >= sevenDaysAgo,
    ).length;
    const lastLogin = users
      .filter((u: any) => u.lastLoginAt)
      .sort((a: any, b: any) => (b.lastLoginAt?.getTime() ?? 0) - (a.lastLoginAt?.getTime() ?? 0));
    return {
      tenantId: tenant.id,
      userCount: users.length,
      activeUserCountLast30Days: activeUserCount,
      lastLoginAt: lastLogin.length > 0 ? (lastLogin[0] as any).lastLoginAt : null,
      createdAt: tenant.createdAt,
    };
  }

  /**
   * Updates a tenant's general properties.
   */
  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    wrap(tenant).assign(updateTenantDto);
    await this.tenantRepository.getEntityManager().flush();
    return tenant;
  }

  /**
   * Updates subscription status specifically.
   */
  async updateSubscription(id: string, subscriptionStatus: SubscriptionStatus): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.subscriptionStatus = subscriptionStatus;
    await this.tenantRepository.getEntityManager().flush();
    return tenant;
  }

  /**
   * Toggles feature flags for a tenant.
   */
  async updateFeatures(id: string, features: Record<string, boolean>): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.features = { ...tenant.features, ...features };
    await this.tenantRepository.getEntityManager().flush();
    return tenant;
  }

  /**
   * Soft-deletes a tenant by setting deletedAt.
   */
  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    tenant.deletedAt = new Date();
    await this.tenantRepository.getEntityManager().flush();
  }
}
