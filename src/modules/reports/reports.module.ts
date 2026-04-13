import { Module } from '@nestjs/common';
import { InventoryReportService } from './services/inventory-report.service';
import { SalesReportService } from './services/sales-report.service';
import { FinanceReportService } from './services/finance-report.service';
import { DashboardService } from './services/dashboard.service';
import { ExcelExportService } from './services/excel-export.service';
import { ScheduledReportService } from './services/scheduled-report.service';
import { ReportsController } from './controllers/reports.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { ScheduledReportController } from './controllers/scheduled-report.controller';
import { AuthModule } from '../auth/auth.module';
import { DefinitionsModule } from '../definitions/definitions.module';

@Module({
  imports: [AuthModule, DefinitionsModule],
  controllers: [
    ReportsController,
    DashboardController,
    ScheduledReportController,
  ],
  providers: [
    InventoryReportService,
    SalesReportService,
    FinanceReportService,
    DashboardService,
    ExcelExportService,
    ScheduledReportService,
  ],
  exports: [
    InventoryReportService,
    SalesReportService,
    FinanceReportService,
    DashboardService,
    ExcelExportService,
    ScheduledReportService,
  ],
})
export class ReportsModule {}
