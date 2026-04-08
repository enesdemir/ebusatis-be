import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { StockValuation } from './entities/stock-valuation.entity';
import { ExchangeGainLoss } from './entities/exchange-gain-loss.entity';
import { TaxReport } from './entities/tax-report.entity';
import { AccountingService } from './services/accounting.service';
import { AccountingController } from './controllers/accounting.controller';

@Module({
  imports: [MikroOrmModule.forFeature([StockValuation, ExchangeGainLoss, TaxReport])],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService, MikroOrmModule],
})
export class AccountingModule {}
