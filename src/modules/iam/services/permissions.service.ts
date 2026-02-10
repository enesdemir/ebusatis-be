
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: EntityRepository<Permission>,
  ) {}

  async findAll(scope?: string): Promise<Permission[]> {
    const where = scope ? { assignableScope: scope } : {};
    return this.permissionRepository.find(where, { orderBy: { category: 'ASC', slug: 'ASC' } });
  }
}
