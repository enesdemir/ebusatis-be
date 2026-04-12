import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PickingService } from '../services/picking.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { StartPickingDto, ScanKartelaDto } from '../dto';

interface AuthedRequest extends ExpressRequest {
  user?: { sub?: string; id?: string };
}

@Controller('orders/pickings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PickingController {
  constructor(private readonly service: PickingService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('by-sales-order/:salesOrderId')
  findBySalesOrder(@Param('salesOrderId') salesOrderId: string) {
    return this.service.findBySalesOrder(salesOrderId);
  }

  @Post('start')
  start(@Body() dto: StartPickingDto, @Req() req: AuthedRequest) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.service.startPicking(dto.salesOrderId, dto.notes, userId);
  }

  @Post(':id/scan')
  scan(
    @Param('id') id: string,
    @Body() dto: ScanKartelaDto,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.service.scanKartela(id, dto.barcode, userId);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.service.completePicking(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancelPicking(id);
  }
}
