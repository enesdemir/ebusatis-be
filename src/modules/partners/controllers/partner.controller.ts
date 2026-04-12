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
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { PartnerService } from '../services/partner.service';
import {
  CreatePartnerDto,
  UpdatePartnerDto,
  CreateAddressDto,
  CreateContactDto,
  CreateCounterpartyDto,
  CreateInteractionDto,
} from '../dto/create-partner.dto';
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

  // ─── Address ──────────────────────────────────────────────

  @Get(':id/addresses')
  async getAddresses(@Param('id') partnerId: string) {
    return this.partnerService.getAddresses(partnerId);
  }

  @Post(':id/addresses')
  async createAddress(
    @Param('id') partnerId: string,
    @Body() dto: Omit<CreateAddressDto, 'partnerId'>,
  ) {
    return this.partnerService.createAddress({ ...dto, partnerId });
  }

  @Patch(':id/addresses/:addressId')
  async updateAddress(
    @Param('addressId') addressId: string,
    @Body() dto: Partial<CreateAddressDto>,
  ) {
    return this.partnerService.updateAddress(addressId, dto);
  }

  @Delete(':id/addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAddress(@Param('addressId') addressId: string) {
    return this.partnerService.removeAddress(addressId);
  }

  // ─── Contact ──────────────────────────────────────────────

  @Get(':id/contacts')
  async getContacts(@Param('id') partnerId: string) {
    return this.partnerService.getContacts(partnerId);
  }

  @Post(':id/contacts')
  async createContact(
    @Param('id') partnerId: string,
    @Body() dto: Omit<CreateContactDto, 'partnerId'>,
  ) {
    return this.partnerService.createContact({ ...dto, partnerId });
  }

  @Patch(':id/contacts/:contactId')
  async updateContact(
    @Param('contactId') contactId: string,
    @Body() dto: Partial<CreateContactDto>,
  ) {
    return this.partnerService.updateContact(contactId, dto);
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeContact(@Param('contactId') contactId: string) {
    return this.partnerService.removeContact(contactId);
  }

  // ─── Counterparty (Cari Hesap) ────────────────────────────

  @Get(':id/counterparties')
  async getCounterparties(@Param('id') partnerId: string) {
    return this.partnerService.getCounterparties(partnerId);
  }

  @Post(':id/counterparties')
  async createCounterparty(
    @Param('id') partnerId: string,
    @Body() dto: Omit<CreateCounterpartyDto, 'partnerId'>,
  ) {
    return this.partnerService.createCounterparty({ ...dto, partnerId });
  }

  @Patch(':id/counterparties/:cpId')
  async updateCounterparty(
    @Param('cpId') cpId: string,
    @Body() dto: Partial<CreateCounterpartyDto>,
  ) {
    return this.partnerService.updateCounterparty(cpId, dto);
  }

  @Delete(':id/counterparties/:cpId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCounterparty(@Param('cpId') cpId: string) {
    return this.partnerService.removeCounterparty(cpId);
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
