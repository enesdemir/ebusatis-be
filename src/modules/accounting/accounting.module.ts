import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StockValuation } from './entities/stock-valuation.entity';
import { ExchangeGainLoss } from './entities/exchange-gain-loss.entity';
import { TaxReport } from './entities/tax-report.entity';
import { LandedCostCalculation } from './entities/landed-cost-calculation.entity';
import { PurchaseOrder } from '../orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../orders/entities/purchase-order-line.entity';
import { Shipment } from '../logistics/entities/shipment.entity';
import { ShipmentLeg } from '../logistics/entities/shipment-leg.entity';
import { CustomsDeclaration } from '../logistics/entities/customs-declaration.entity';
import { Currency } from '../definitions/entities/currency.entity';
import { AccountingService } from './services/accounting.service';
import { LandedCostService } from './services/landed-cost.service';
import { AccountingController } from './controllers/accounting.controller';
import { LandedCostController } from './controllers/landed-cost.controller';

/**
 * Accounting module.
 *
 * Owns the finance-adjacent calculation engines: stock valuation,
 * exchange gain / loss tracking, tax reporting and — added in stage
 * 0.C — the landed cost calculator that backs margin reporting and
 * inventory valuation in the international-import flow.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      StockValuation,
      ExchangeGainLoss,
      TaxReport,
      LandedCostCalculation,
      PurchaseOrder,
      PurchaseOrderLine,
      Shipment,
      ShipmentLeg,
      CustomsDeclaration,
      Currency,
    ]),
  ],
  controllers: [AccountingController, LandedCostController],
  providers: [AccountingService, LandedCostService],
  exports: [AccountingService, LandedCostService, MikroOrmModule],
})
export class AccountingModule {}
