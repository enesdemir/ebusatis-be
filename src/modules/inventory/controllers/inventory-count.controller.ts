import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { InventoryCountService } from '../services/inventory-count.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CountType } from '../entities/inventory-count.entity';

interface AuthedRequest extends ExpressRequest {
  user?: { sub?: string; id?: string };
}

@Controller('inventory/counts')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InventoryCountController {
  constructor(private readonly service: InventoryCountService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/variance-report')
  varianceReport(@Param('id') id: string) {
    return this.service.varianceReport(id);
  }

  @Post('start')
  start(
    @Body()
    data: { warehouseId: string; type: CountType; notes?: string },
    @Req() req: AuthedRequest,
  ) {
    const userId = (req.user?.sub ?? req.user?.id) as string;
    return this.service.start(data, userId);
  }

  @Post(':id/lines')
  addLine(
    @Param('id') id: string,
    @Body()
    data: { itemId: string; actualQuantity: number; notes?: string },
  ) {
    return this.service.addLine(id, data);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.service.complete(id);
  }

  @Post(':id/reconcile')
  reconcile(@Param('id') id: string) {
    return this.service.reconcile(id);
  }
}
