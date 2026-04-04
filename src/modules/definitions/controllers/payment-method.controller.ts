import { Controller, UseGuards } from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodService } from '../services/payment-method.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/payment-methods')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentMethodController extends BaseDefinitionController<PaymentMethod> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {
    super(paymentMethodService);
  }
}
