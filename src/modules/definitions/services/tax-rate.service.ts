import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { TaxRate } from '../entities/tax-rate.entity';

@Injectable()
export class TaxRateService extends BaseDefinitionService<TaxRate> {
  constructor(em: EntityManager) {
    super(em, TaxRate, ['name', 'code']);
  }
}
