import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductionService } from '../services/production.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import {
  CreateSupplierProductionOrderDto,
  UpdateSupplierProductionStatusDto,
  SupplierProductionOrderQueryDto,
  UpdateMilestoneDto,
  SupplierMilestoneReportDto,
  CreateQualityCheckDto,
  UpdateQualityCheckDto,
  AddProductionMediaDto,
} from '../dto';

/**
 * Supplier production tracking controller.
 *
 * Owns the supplier-side production lifecycle for the international
 * import flow. This controller is NOT used for in-house production.
 *
 * CLAUDE.md compliance:
 *   - Protected by JwtAuthGuard + TenantGuard.
 *   - Every @Body / @Query parameter is a class-validator DTO (no `any`).
 *   - Error messages are returned by the service as error code +
 *     i18n key — no hardcoded TR/EN strings on this layer either.
 */
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly service: ProductionService) {}

  // ── Supplier production orders ──

  @Get('orders')
  findAll(@Query() query: SupplierProductionOrderQueryDto) {
    return this.service.findAllOrders(query);
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOrderById(id);
  }

  @Post('orders')
  create(@Body() dto: CreateSupplierProductionOrderDto) {
    return this.service.createOrder(dto);
  }

  @Patch('orders/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSupplierProductionStatusDto) {
    return this.service.updateOrderStatus(id, dto.status);
  }

  // ── Milestones ──

  @Patch('milestones/:id')
  updateMilestone(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    return this.service.updateMilestone(id, dto);
  }

  /**
   * Supplier-side milestone report endpoint. In a future iteration this
   * route will be protected by a dedicated supplier-portal token rather
   * than a regular tenant JWT.
   */
  @Patch('milestones/:id/supplier-report')
  reportMilestoneFromSupplier(
    @Param('id') id: string,
    @Body() dto: SupplierMilestoneReportDto,
  ) {
    return this.service.reportMilestoneFromSupplier(id, dto);
  }

  // ── Quality control ──

  @Post('qc')
  createQC(@Body() dto: CreateQualityCheckDto) {
    return this.service.createQC(dto);
  }

  @Patch('qc/:id')
  updateQC(@Param('id') id: string, @Body() dto: UpdateQualityCheckDto) {
    return this.service.updateQC(id, dto);
  }

  // ── Media ──

  @Post('media')
  addMedia(@Body() dto: AddProductionMediaDto) {
    return this.service.addMedia(dto);
  }
}
