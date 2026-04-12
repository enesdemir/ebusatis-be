import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PaymentService } from '../services/payment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { CreatePaymentDto } from '../dto';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    sub?: string;
    id?: string;
    [key: string]: unknown;
  };
}

@Controller('finance/payments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get()
  findAll(@Query() query: PaginatedQueryDto & Record<string, unknown>) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: CreatePaymentDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(data, req.user?.sub);
  }

  @Get('ledger/:counterpartyId')
  getLedger(
    @Param('counterpartyId') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getLedger(id, from, to);
  }
}
