import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';

@Injectable()
export class UnitOfMeasureService extends BaseDefinitionService<UnitOfMeasure> {
  constructor(em: EntityManager) {
    super(em, UnitOfMeasure, ['name', 'code', 'symbol']);
  }
}
