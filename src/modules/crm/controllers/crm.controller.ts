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
import { LeadStage } from '../entities/lead.entity';
import {
  CreateFairDto,
  UpdateFairStatusDto,
  AddParticipantDto,
  CreateLeadDto,
  MoveLeadStageDto,
  CreateLeadSourceDto,
} from '../dto';

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
  createFair(@Body() data: CreateFairDto) {
    return this.service.createFair(data);
  }

  @Patch('fairs/:id/status')
  updateFairStatus(@Param('id') id: string, @Body() body: UpdateFairStatusDto) {
    return this.service.updateFairStatus(id, body.status);
  }

  @Post('fairs/:id/participants')
  addParticipant(@Param('id') id: string, @Body() data: AddParticipantDto) {
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
  createLead(@Body() data: CreateLeadDto) {
    return this.service.createLead(data);
  }

  @Patch('leads/:id/stage')
  moveLeadStage(@Param('id') id: string, @Body() body: MoveLeadStageDto) {
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
  createLeadSource(@Body() data: CreateLeadSourceDto) {
    return this.service.createLeadSource(data);
  }
}
