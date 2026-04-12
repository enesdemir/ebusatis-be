import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    sub?: string;
    id?: string;
    [key: string]: unknown;
  };
}
import { SourcingService } from '../services/sourcing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateRfqDto, CreateRfqResponseDto, UpdateRfqStatusDto } from '../dto';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('sourcing')
export class SourcingController {
  constructor(private readonly service: SourcingService) {}

  @Get('rfqs')
  findAll(@Query() params: PaginatedQueryDto) {
    return this.service.findAllRFQs(params);
  }

  @Get('rfqs/:id')
  findOne(@Param('id') id: string) {
    return this.service.findRFQById(id);
  }

  @Post('rfqs')
  create(@Body() data: CreateRfqDto, @Request() req: AuthenticatedRequest) {
    return this.service.createRFQ({ ...data, createdBy: req.user?.id });
  }

  @Patch('rfqs/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateRfqStatusDto) {
    return this.service.updateRFQStatus(id, body.status);
  }

  @Post('rfqs/:id/responses')
  addResponse(@Param('id') id: string, @Body() data: CreateRfqResponseDto) {
    return this.service.addResponse(id, data);
  }

  @Patch('responses/:id/select')
  selectResponse(@Param('id') id: string) {
    return this.service.selectResponse(id);
  }

  @Post('responses/:id/convert-to-po')
  convertToPO(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = (req.user?.sub ?? req.user?.id) as string;
    return this.service.convertRfqToPurchaseOrder(id, userId);
  }

  @Get('rfqs/:id/compare')
  compare(@Param('id') id: string) {
    return this.service.compareResponses(id);
  }
}
