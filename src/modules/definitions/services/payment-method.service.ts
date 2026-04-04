import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { PaymentMethod } from '../entities/payment-method.entity';

@Injectable()
export class PaymentMethodService extends BaseDefinitionService<PaymentMethod> {
  constructor(em: EntityManager) {
    super(em, PaymentMethod, ['name', 'code']);
  }
}
