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
import { PhysicalSampleService } from '../services/physical-sample.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

interface AuthedRequest extends ExpressRequest {
  user?: { sub?: string; id?: string };
}

@Controller('crm/samples')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PhysicalSampleController {
  constructor(private readonly service: PhysicalSampleService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('overdue')
  overdue() {
    return this.service.findOverdueLoans();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/lend')
  lend(
    @Param('id') id: string,
    @Body()
    data: {
      partnerId?: string;
      userId?: string;
      expectedReturnDate?: string;
      notes?: string;
    },
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.service.lend(id, data, userId);
  }

  @Post(':id/return')
  returnSample(
    @Param('id') id: string,
    @Body() data: { notes?: string },
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.service.returnSample(id, userId, data.notes);
  }
}
