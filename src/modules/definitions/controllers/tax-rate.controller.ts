import { Controller, UseGuards } from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { TaxRate } from '../entities/tax-rate.entity';
import { TaxRateService } from '../services/tax-rate.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/tax-rates')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TaxRateController extends BaseDefinitionController<TaxRate> {
  constructor(private readonly taxRateService: TaxRateService) {
    super(taxRateService);
  }
}
