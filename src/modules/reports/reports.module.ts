import { Module } from '@nestjs/common';
import { InventoryReportService } from './services/inventory-report.service';
import { SalesReportService } from './services/sales-report.service';
import { FinanceReportService } from './services/finance-report.service';
import { ReportsController } from './controllers/reports.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [InventoryReportService, SalesReportService, FinanceReportService],
  exports: [InventoryReportService, SalesReportService, FinanceReportService],
})
export class ReportsModule {}
