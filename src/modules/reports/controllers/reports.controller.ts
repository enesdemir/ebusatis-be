import { Controller, UseGuards, Get, Query } from '@nestjs/common';
import { InventoryReportService } from '../services/inventory-report.service';
import { SalesReportService } from '../services/sales-report.service';
import { FinanceReportService } from '../services/finance-report.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController {
  constructor(
    private readonly inventoryReport: InventoryReportService,
    private readonly salesReport: SalesReportService,
    private readonly financeReport: FinanceReportService,
  ) {}

  // ─── Stok Raporları ───────────────────────────────────────

  @Get('inventory/stock-status')
  stockStatus(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryReport.stockStatus(warehouseId);
  }

  @Get('inventory/movements')
  movementReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.inventoryReport.movementReport(from, to, variantId);
  }

  @Get('inventory/aging')
  agingReport(@Query('days') days?: string) {
    return this.inventoryReport.agingReport(days ? parseInt(days) : 90);
  }

  // ─── Satış Raporları ──────────────────────────────────────

  @Get('sales/performance')
  salesPerformance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.salesReport.salesPerformance(from, to);
  }

  @Get('sales/top-products')
  topProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesReport.topProducts(from, to, limit ? parseInt(limit) : 10);
  }

  @Get('sales/profitability')
  profitability(@Query('from') from?: string, @Query('to') to?: string) {
    return this.salesReport.profitability(from, to);
  }

  // ─── Finans Raporları ─────────────────────────────────────

  @Get('finance/balances')
  balanceReport() {
    return this.financeReport.balanceReport();
  }

  @Get('finance/aging')
  agingAnalysis() {
    return this.financeReport.agingAnalysis();
  }

  @Get('finance/cash-flow')
  cashFlow(@Query('from') from?: string, @Query('to') to?: string) {
    return this.financeReport.cashFlow(from, to);
  }
}
