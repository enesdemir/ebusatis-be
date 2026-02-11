import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, FilterQuery } from '@mikro-orm/postgresql';
import { User } from '../../users/entities/user.entity';

/** Query parameters for cross-tenant user listing */
interface AdminUserQueryInput {
  search?: string;
  tenantId?: string;
  isTenantOwner?: boolean;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  /**
   * Lists all platform users (cross-tenant) with filters and pagination.
   */
  async findAll(query: AdminUserQueryInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: FilterQuery<User> = {};
    if (query.search) {
      where.email = { $like: `%${query.search}%` };
    }
    if (query.tenantId) {
      where.tenant = query.tenantId;
    }
    if (query.isTenantOwner !== undefined) {
      where.isTenantOwner = query.isTenantOwner;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.isSuperAdmin !== undefined) {
      where.isSuperAdmin = query.isSuperAdmin;
    }
    const [data, total] = await this.userRepository.findAndCount(where, {
      populate: ['tenant', 'roles'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset,
    });
    return {
      data: data.map(user => ({
        id: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        isTenantOwner: user.isTenantOwner,
        isActive: user.isActive,
        locale: user.locale,
        lastLoginAt: user.lastLoginAt,
        tenant: user.tenant
          ? { id: user.tenant.id, name: user.tenant.name, domain: user.tenant.domain }
          : null,
        roles: user.roles.getItems().map(r => ({ id: r.id, name: r.name })),
        createdAt: user.createdAt,
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
   * Returns a single user's detailed profile (cross-tenant).
   */
  async findOne(id: string) {
    const user = await this.userRepository.findOne(
      { id },
      { populate: ['tenant', 'roles', 'roles.permissions'] },
    );
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      isTenantOwner: user.isTenantOwner,
      isActive: user.isActive,
      locale: user.locale,
      lastLoginAt: user.lastLoginAt,
      tenant: user.tenant
        ? { id: user.tenant.id, name: user.tenant.name, domain: user.tenant.domain }
        : null,
      roles: user.roles.getItems().map(r => ({
        id: r.id,
        name: r.name,
        permissions: r.permissions.getItems().map(p => p.slug),
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Toggles user active status.
   */
  async updateStatus(id: string, isActive: boolean) {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    user.isActive = isActive;
    await this.userRepository.getEntityManager().flush();
    return { id: user.id, email: user.email, isActive: user.isActive };
  }
}
