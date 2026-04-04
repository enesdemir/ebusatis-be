import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class WarehouseService extends BaseDefinitionService<Warehouse> {
  constructor(em: EntityManager) {
    super(em, Warehouse, ['name', 'code', 'city']);
  }
}
