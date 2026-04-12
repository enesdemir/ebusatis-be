import { Module } from '@nestjs/common';
import { InventoryReportService } from './services/inventory-report.service';
import { SalesReportService } from './services/sales-report.service';
import { FinanceReportService } from './services/finance-report.service';
import { DashboardService } from './services/dashboard.service';
import { ExcelExportService } from './services/excel-export.service';
import { ReportsController } from './controllers/reports.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController, DashboardController],
  providers: [
    InventoryReportService,
    SalesReportService,
    FinanceReportService,
    DashboardService,
    ExcelExportService,
  ],
  exports: [
    InventoryReportService,
    SalesReportService,
    FinanceReportService,
    DashboardService,
    ExcelExportService,
  ],
})
export class ReportsModule {}
