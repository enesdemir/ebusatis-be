import { Controller, UseGuards, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { PartnerService } from '../services/partner.service';
import { CreatePartnerDto, UpdatePartnerDto, CreateCounterpartyDto, CreateInteractionDto } from '../dto/create-partner.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

@Controller('partners')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  // ─── Partner CRUD ─────────────────────────────────────────

  @Get()
  async findAll(@Query() query: PaginatedQueryDto & { type?: string }) {
    return this.partnerService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.partnerService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePartnerDto) {
    return this.partnerService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnerService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.partnerService.remove(id);
  }

  // ─── Counterparty (Cari Hesap) ────────────────────────────

  @Get(':id/counterparties')
  async getCounterparties(@Param('id') partnerId: string) {
    return this.partnerService.getCounterparties(partnerId);
  }

  @Post(':id/counterparties')
  async createCounterparty(@Param('id') partnerId: string, @Body() dto: Omit<CreateCounterpartyDto, 'partnerId'>) {
    return this.partnerService.createCounterparty({ ...dto, partnerId });
  }

  // ─── Interaction (CRM) ───────────────────────────────────

  @Get(':id/interactions')
  async getInteractions(@Param('id') partnerId: string) {
    return this.partnerService.getInteractions(partnerId);
  }

  @Post(':id/interactions')
  async createInteraction(
    @Param('id') partnerId: string,
    @Body() dto: Omit<CreateInteractionDto, 'partnerId'>,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.partnerService.createInteraction({ ...dto, partnerId }, userId);
  }
}
