import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentAccountAgingService } from '../services/current-account-aging.service';
import { ReconciliationService } from '../services/reconciliation.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('finance/partners')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AccountStatementController {
  constructor(
    private readonly aging: CurrentAccountAgingService,
    private readonly reconciliation: ReconciliationService,
  ) {}

  @Get(':partnerId/aging')
  getAging(@Param('partnerId') partnerId: string) {
    return this.aging.getAging(partnerId);
  }

  @Get(':partnerId/reconciliation')
  getReconciliation(@Param('partnerId') partnerId: string) {
    return this.reconciliation.reconcilePartner(partnerId);
  }
}
