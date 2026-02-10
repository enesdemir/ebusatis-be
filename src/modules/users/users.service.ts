
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { Role } from '../iam/entities/role.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: EntityRepository<Role>,
    private readonly em: EntityManager,
  ) {}

  async findAll(tenantId: string): Promise<User[]> {
    return this.userRepository.find({ tenant: tenantId }, { populate: ['roles'] });
  }

  async findOne(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepository.findOne({ id, tenant: tenantId }, { populate: ['roles'] });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  async create(tenantId: string, dto: { email: string; roleIds?: string[] }): Promise<User> {
    const existing = await this.userRepository.findOne({ email: dto.email });
    if (existing) {
        throw new ConflictException('Email already in use');
    }

    const tenant = await this.em.findOne(Tenant, tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const user = new User(dto.email, tenant);
    
    // Temporary password logic
    user.passwordHash = '$2b$10$EpIxNt.irO7y7P/s3f.uUO.6X.L/8.q.Z.g.w/0.1.2.3'; 

    if (dto.roleIds && dto.roleIds.length > 0) {
        const roles = await this.roleRepository.find({
            id: { $in: dto.roleIds },
            $or: [{ tenant: tenantId }, { tenant: null }]
        });
        user.roles.set(roles);
    }

    await this.em.persistAndFlush(user);
    return user;
  }

  async update(id: string, tenantId: string, dto: { roleIds?: string[] }): Promise<User> {
    const user = await this.findOne(id, tenantId);

    if (dto.roleIds) {
         const roles = await this.roleRepository.find({
            id: { $in: dto.roleIds },
            $or: [{ tenant: tenantId }, { tenant: null }]
        });
        user.roles.set(roles);
    }
    
    await this.em.flush();
    return user;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const user = await this.findOne(id, tenantId);
    
    if (user.isTenantOwner) {
        throw new ConflictException('Cannot delete tenant owner');
    }

    await this.em.removeAndFlush(user);
  }
}
