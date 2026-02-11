import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Permission } from '../entities/permission.entity';

/** Input shape for creating a permission */
interface CreatePermissionInput {
  slug: string;
  category: string;
  assignableScope?: string;
  description?: string;
}

/** Input shape for updating a permission */
interface UpdatePermissionInput {
  category?: string;
  assignableScope?: string;
  description?: string;
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: EntityRepository<Permission>,
  ) {}

  /**
   * Lists all permissions, optionally filtered by scope.
   */
  async findAll(scope?: string): Promise<Permission[]> {
    const where = scope ? { assignableScope: scope } : {};
    return this.permissionRepository.find(where, { orderBy: { category: 'ASC', slug: 'ASC' } });
  }

  /**
   * Returns all unique permission categories.
   */
  async findCategories(): Promise<string[]> {
    const permissions = await this.permissionRepository.findAll({
      fields: ['category'],
      orderBy: { category: 'ASC' },
    });
    const categories = [...new Set(permissions.map(p => p.category))];
    return categories;
  }

  /**
   * Creates a new permission definition.
   */
  async create(input: CreatePermissionInput): Promise<Permission> {
    const existing = await this.permissionRepository.findOne({ slug: input.slug });
    if (existing) {
      throw new ConflictException(`Permission with slug '${input.slug}' already exists.`);
    }
    const permission = new Permission(
      input.slug,
      input.category,
      input.assignableScope ?? 'TENANT',
    );
    permission.description = input.description;
    const em = this.permissionRepository.getEntityManager();
    await em.persistAndFlush(permission);
    return permission;
  }

  /**
   * Updates an existing permission.
   */
  async update(id: string, input: UpdatePermissionInput): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ id });
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found.`);
    }
    if (input.category !== undefined) {
      permission.category = input.category;
    }
    if (input.assignableScope !== undefined) {
      permission.assignableScope = input.assignableScope;
    }
    if (input.description !== undefined) {
      permission.description = input.description;
    }
    await this.permissionRepository.getEntityManager().flush();
    return permission;
  }

  /**
   * Deletes a permission by ID.
   */
  async remove(id: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({ id });
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found.`);
    }
    await this.permissionRepository.getEntityManager().removeAndFlush(permission);
  }
}
