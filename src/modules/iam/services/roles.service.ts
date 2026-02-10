
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: EntityRepository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: EntityRepository<Permission>,
    private readonly em: EntityManager,
  ) {}

  async findAllSystemRoles(): Promise<Role[]> {
    return this.roleRepository.find({ tenant: null }, { populate: ['permissions'], orderBy: { name: 'ASC' } });
  }

  async findOneSystemRole(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ id, tenant: null }, { populate: ['permissions'] });
    if (!role) {
      throw new NotFoundException(`System Role not found`);
    }
    return role;
  }

  async createSystemRole(dto: { name: string; permissions: string[] }): Promise<Role> {
    const role = new Role(dto.name);
    // tenant is undefined by default, ensuring it's global
    
    if (dto.permissions) {
      if (dto.permissions.length > 0) {
        const perms = await this.permissionRepository.find({ slug: { $in: dto.permissions } });
        role.permissions.set(perms);
      } else {
        role.permissions.removeAll();
      }
    }

    await this.em.persistAndFlush(role);
    return role;
  }

  async updateSystemRole(id: string, dto: { name: string; permissions: string[] }): Promise<Role> {
    const role = await this.findOneSystemRole(id);
    role.name = dto.name;
    
    if (dto.permissions) {
       if (dto.permissions.length > 0) {
         const perms = await this.permissionRepository.find({ slug: { $in: dto.permissions } });
         role.permissions.set(perms);
       } else {
         role.permissions.removeAll();
       }
    }
    
    await this.em.flush();
    return role;
  }

  async deleteSystemRole(id: string): Promise<void> {
    const role = await this.findOneSystemRole(id);
    if (role.isSystemRole) {
       throw new Error('Cannot delete a protected system role');
    }
    await this.em.removeAndFlush(role);
  }
  // Tenant Methods

  async findAll(tenantId: string): Promise<Role[]> {
    return this.roleRepository.find(
      {
        $or: [
          { tenant: tenantId },
          { tenant: null }
        ]
      },
      { populate: ['permissions'], orderBy: { name: 'ASC' } }
    );
  }

  async findOne(id: string, tenantId: string): Promise<Role> {
    const role = await this.roleRepository.findOne(
        {
            id,
            $or: [{ tenant: tenantId }, { tenant: null }]
        },
        { populate: ['permissions'] }
    );

    if (!role) {
        throw new NotFoundException('Role not found or access denied');
    }
    
    return role;
  }

  async create(tenantId: string, dto: { name: string; permissions: string[] }): Promise<Role> {
    const role = new Role(dto.name);
    role.tenant = this.em.getReference(Tenant, tenantId);

    if (dto.permissions && dto.permissions.length > 0) {
      const perms = await this.permissionRepository.find({ 
          slug: { $in: dto.permissions },
          assignableScope: 'TENANT' 
      });
      role.permissions.set(perms);
    }

    await this.em.persistAndFlush(role);
    return role;
  }

  async update(id: string, tenantId: string, dto: { name: string; permissions: string[] }): Promise<Role> {
    const role = await this.roleRepository.findOne({ id, tenant: tenantId }, { populate: ['permissions'] });
    
    if (!role) {
        throw new NotFoundException('Role not found');
    }

    if (!role.tenant) {
        throw new Error('Cannot update system roles via tenant API');
    }

    role.name = dto.name;

    if (dto.permissions) {
        if (dto.permissions.length > 0) {
            const perms = await this.permissionRepository.find({ 
                slug: { $in: dto.permissions },
                assignableScope: 'TENANT' 
            });
            role.permissions.set(perms);
        } else {
            role.permissions.removeAll();
        }
    }

    await this.em.flush();
    return role;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const role = await this.roleRepository.findOne({ id, tenant: tenantId });
    if (!role) {
        throw new NotFoundException('Role not found');
    }
    
    if (role.isSystemRole) {
        throw new Error('Cannot delete system roles');
    }
    
    await this.em.removeAndFlush(role);
  }
}
