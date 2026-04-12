import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountingService } from '../services/accounting.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import {
  CreateStockValuationDto,
  CreateExchangeGainLossDto,
  CreateTaxReportDto,
  UpdateTaxReportDto,
} from '../dto';

/**
 * Accounting controller.
 *
 * CLAUDE.md compliance:
 *   - JwtAuthGuard + TenantGuard on all endpoints.
 *   - Every @Body / @Query uses a class-validator DTO.
 */
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  // ── Stock valuation ──

  @Get('valuations')
  findValuations(@Query() query: PaginatedQueryDto) {
    return this.service.findValuations(query);
  }

  @Post('valuations')
  createValuation(@Body() dto: CreateStockValuationDto) {
    return this.service.createValuation(dto);
  }

  // ── Exchange gain/loss ──

  @Get('exchange-gains')
  findExchangeGains(@Query() query: PaginatedQueryDto) {
    return this.service.findExchangeGainLosses(query);
  }

  @Post('exchange-gains')
  createExchangeGain(@Body() dto: CreateExchangeGainLossDto) {
    return this.service.createExchangeGainLoss(dto);
  }

  // ── Tax reports ──

  @Get('tax-reports')
  findTaxReports(@Query() query: PaginatedQueryDto & { type?: string }) {
    return this.service.findTaxReports(query);
  }

  @Post('tax-reports')
  createTaxReport(@Body() dto: CreateTaxReportDto) {
    return this.service.createTaxReport(dto);
  }

  @Patch('tax-reports/:id')
  updateTaxReport(@Param('id') id: string, @Body() dto: UpdateTaxReportDto) {
    return this.service.updateTaxReport(id, dto);
  }
}
