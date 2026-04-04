import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { StatusDefinition } from '../entities/status-definition.entity';

@Injectable()
export class StatusDefinitionService extends BaseDefinitionService<StatusDefinition> {
  constructor(em: EntityManager) {
    super(em, StatusDefinition, ['name', 'code']);
  }
}
