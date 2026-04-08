import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductionService } from '../services/production.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly service: ProductionService) {}

  // ── Üretim Emirleri ──

  @Get('orders')
  findAll(@Query() params: any) {
    return this.service.findAllOrders(params);
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOrderById(id);
  }

  @Post('orders')
  create(@Body() data: any, @Request() req: any) {
    return this.service.createOrder({ ...data, createdBy: req.user?.id, tenant: req.user?.tenantId });
  }

  @Patch('orders/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.service.updateOrderStatus(id, status);
  }

  // ── Milestone'lar ──

  @Patch('milestones/:id')
  updateMilestone(@Param('id') id: string, @Body() data: any) {
    return this.service.updateMilestone(id, data);
  }

  // ── QC ──

  @Post('qc')
  createQC(@Body() data: any) {
    return this.service.createQC(data);
  }

  @Patch('qc/:id')
  updateQC(@Param('id') id: string, @Body() data: any) {
    return this.service.updateQC(id, data);
  }

  // ── BOM ──

  @Get('bom')
  findAllBOMs() {
    return this.service.findAllBOMs();
  }

  @Post('bom')
  createBOM(@Body() data: any) {
    return this.service.createBOM(data);
  }
}
