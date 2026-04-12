import {
  Controller,
  UseGuards,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { CreateInvoiceDto } from '../dto';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    sub?: string;
    id?: string;
    [key: string]: unknown;
  };
}

@Controller('finance/invoices')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Get()
  findAll(@Query() query: PaginatedQueryDto & Record<string, unknown>) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: CreateInvoiceDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(data, req.user?.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
