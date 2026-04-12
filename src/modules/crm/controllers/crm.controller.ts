import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CrmService } from '../services/crm.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { FairStatus } from '../entities/fair.entity';
import { LeadStage } from '../entities/lead.entity';

@Controller('crm')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CrmController {
  constructor(private readonly service: CrmService) {}

  // ── Fairs ──

  @Get('fairs')
  listFairs() {
    return this.service.listFairs();
  }

  @Get('fairs/:id')
  findFair(@Param('id') id: string) {
    return this.service.findFair(id);
  }

  @Post('fairs')
  createFair(
    @Body()
    data: {
      name: string;
      venue?: string;
      city?: string;
      country?: string;
      startDate: string;
      endDate: string;
      description?: string;
      budget?: number;
      currency?: string;
    },
  ) {
    return this.service.createFair(data);
  }

  @Patch('fairs/:id/status')
  updateFairStatus(
    @Param('id') id: string,
    @Body() body: { status: FairStatus },
  ) {
    return this.service.updateFairStatus(id, body.status);
  }

  @Post('fairs/:id/participants')
  addParticipant(
    @Param('id') id: string,
    @Body()
    data: {
      fullName: string;
      company?: string;
      title?: string;
      email?: string;
      phone?: string;
      notes?: string;
    },
  ) {
    return this.service.addParticipant(id, data);
  }

  // ── Leads ──

  @Get('leads')
  listLeads(@Query('stage') stage?: LeadStage) {
    return this.service.listLeads(stage);
  }

  @Get('leads/:id')
  findLead(@Param('id') id: string) {
    return this.service.findLead(id);
  }

  @Post('leads')
  createLead(
    @Body()
    data: {
      fullName: string;
      company?: string;
      email?: string;
      phone?: string;
      sourceId?: string;
      fairId?: string;
      estimatedValue?: number;
      currency?: string;
      ownerId?: string;
      notes?: string;
    },
  ) {
    return this.service.createLead(data);
  }

  @Patch('leads/:id/stage')
  moveLeadStage(@Param('id') id: string, @Body() body: { stage: LeadStage }) {
    return this.service.moveLeadStage(id, body.stage);
  }

  @Post('leads/:id/convert')
  convertLead(@Param('id') id: string) {
    return this.service.convertLeadToPartner(id);
  }

  // ── LeadSources ──

  @Get('lead-sources')
  listLeadSources() {
    return this.service.listLeadSources();
  }

  @Post('lead-sources')
  createLeadSource(@Body() data: { code: string; name: string }) {
    return this.service.createLeadSource(data);
  }
}
