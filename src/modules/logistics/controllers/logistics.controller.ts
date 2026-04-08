import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { LogisticsService } from '../services/logistics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly service: LogisticsService) {}

  // ── Sevkiyat Planlari ──
  @Get('plans')
  findAllPlans(@Query() params: any) { return this.service.findAllPlans(params); }

  @Get('plans/:id')
  findPlan(@Param('id') id: string) { return this.service.findPlanById(id); }

  @Post('plans')
  createPlan(@Body() data: any, @Request() req: any) {
    return this.service.createPlan({ ...data, createdBy: req.user?.id, tenant: req.user?.tenantId });
  }

  @Patch('plans/:id/status')
  updatePlanStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.service.updatePlanStatus(id, status);
  }

  @Post('plans/:id/events')
  addEvent(@Param('id') id: string, @Body() data: any) {
    return this.service.addEvent(id, data);
  }

  // ── Gumruk ──
  @Get('customs')
  findAllCustoms(@Query() params: any) { return this.service.findAllCustoms(params); }

  @Post('customs')
  createCustoms(@Body() data: any) { return this.service.createCustoms(data); }

  // ── Nakliye Teklifleri ──
  @Get('quotes')
  findQuotes(@Query('shipmentPlanId') shipmentPlanId?: string) { return this.service.findQuotes(shipmentPlanId); }

  @Post('quotes')
  createQuote(@Body() data: any) { return this.service.createQuote(data); }

  @Patch('quotes/:id/select')
  selectQuote(@Param('id') id: string) { return this.service.selectQuote(id); }
}
