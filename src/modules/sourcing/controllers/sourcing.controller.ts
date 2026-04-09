import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SourcingService } from '../services/sourcing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sourcing')
export class SourcingController {
  constructor(private readonly service: SourcingService) {}

  @Get('rfqs') findAll(@Query() params: any) { return this.service.findAllRFQs(params); }
  @Get('rfqs/:id') findOne(@Param('id') id: string) { return this.service.findRFQById(id); }
  @Post('rfqs') create(@Body() data: any, @Request() req: any) { return this.service.createRFQ({ ...data, createdBy: req.user?.id }); }
  @Patch('rfqs/:id/status') updateStatus(@Param('id') id: string, @Body('status') status: any) { return this.service.updateRFQStatus(id, status); }
  @Post('rfqs/:id/responses') addResponse(@Param('id') id: string, @Body() data: any) { return this.service.addResponse(id, data); }
  @Patch('responses/:id/select') selectResponse(@Param('id') id: string) { return this.service.selectResponse(id); }
  @Get('rfqs/:id/compare') compare(@Param('id') id: string) { return this.service.compareResponses(id); }
}
