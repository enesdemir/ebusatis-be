import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AccountingService } from '../services/accounting.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  // Stok Degerleme
  @Get('valuations')
  findValuations(@Query() params: any) { return this.service.findValuations(params); }

  @Post('valuations')
  createValuation(@Body() data: any) { return this.service.createValuation(data); }

  // Kur Farki
  @Get('exchange-gains')
  findExchangeGains(@Query() params: any) { return this.service.findExchangeGainLosses(params); }

  @Post('exchange-gains')
  createExchangeGain(@Body() data: any) { return this.service.createExchangeGainLoss(data); }

  // Vergi Raporlari
  @Get('tax-reports')
  findTaxReports(@Query() params: any) { return this.service.findTaxReports(params); }

  @Post('tax-reports')
  createTaxReport(@Body() data: any) { return this.service.createTaxReport(data); }

  @Patch('tax-reports/:id')
  updateTaxReport(@Param('id') id: string, @Body() data: any) { return this.service.updateTaxReport(id, data); }
}
