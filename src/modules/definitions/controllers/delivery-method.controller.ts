import { Controller, UseGuards } from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { DeliveryMethod } from '../entities/delivery-method.entity';
import { DeliveryMethodService } from '../services/delivery-method.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/delivery-methods')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DeliveryMethodController extends BaseDefinitionController<DeliveryMethod> {
  constructor(private readonly deliveryMethodService: DeliveryMethodService) {
    super(deliveryMethodService);
  }
}
