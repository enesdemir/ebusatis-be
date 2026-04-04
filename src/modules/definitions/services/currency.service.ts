import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { Currency } from '../entities/currency.entity';

@Injectable()
export class CurrencyService extends BaseDefinitionService<Currency> {
  constructor(em: EntityManager) {
    super(em, Currency, ['name', 'code', 'symbol']);
  }
}
