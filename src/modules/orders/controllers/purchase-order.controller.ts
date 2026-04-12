import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    sub?: string;
    id?: string;
    [key: string]: unknown;
  };
}
import { PurchaseOrderService } from '../services/purchase-order.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { CreatePurchaseOrderDto } from '../dto';
import { UpdateDeliveryWarningConfigDto } from '../dto/update-delivery-warning-config.dto';

/**
 * Purchase Order controller.
 *
 * Every endpoint is gated by JwtAuthGuard + TenantGuard. New Sprint 5
 * endpoints layered on the CRUD baseline:
 *  - `GET /:id/qr`                         — tracking QR data URL
 *  - `POST /:id/revisions`                 — open a new revision
 *  - `PATCH /:id/delivery-warning-config`  — overwrite the schedule
 */
@Controller('orders/purchase')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PurchaseOrderController {
  constructor(
    private readonly service: PurchaseOrderService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async findAll(@Query() query: PaginatedQueryDto & { supplierId?: string }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Body() data: CreatePurchaseOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(data, req.user?.sub);
  }

  @Get(':id/qr')
  async generateQr(@Param('id') id: string) {
    const publicBaseUrl =
      this.config.get<string>('PUBLIC_FRONTEND_URL') ?? 'http://localhost:5173';
    return this.service.generateQr(id, publicBaseUrl);
  }

  @Post(':id/revisions')
  async createRevision(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createRevision(id, req.user?.sub);
  }

  @Patch(':id/delivery-warning-config')
  async updateDeliveryWarningConfig(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryWarningConfigDto,
  ) {
    return this.service.updateDeliveryWarningConfig(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
