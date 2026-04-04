import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { DeliveryMethod } from '../entities/delivery-method.entity';

@Injectable()
export class DeliveryMethodService extends BaseDefinitionService<DeliveryMethod> {
  constructor(em: EntityManager) {
    super(em, DeliveryMethod, ['name', 'code']);
  }
}
