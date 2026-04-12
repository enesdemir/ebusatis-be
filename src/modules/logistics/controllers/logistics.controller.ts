import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LogisticsService } from '../services/logistics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import {
  CreateShipmentDto,
  UpdateShipmentDto,
  UpdateShipmentStatusDto,
  ShipmentQueryDto,
  AddContainerEventDto,
  CreateCustomsDeclarationDto,
  CustomsDeclarationQueryDto,
  CreateFreightQuoteDto,
  FreightQuoteQueryDto,
  CreateShipmentLegDto,
  UpdateShipmentLegDto,
  CreateCarrierPaymentDto,
  UpdateCarrierPaymentDto,
} from '../dto';

/**
 * Logistics controller.
 *
 * Exposes the unified Shipment lifecycle along with container timeline
 * events, customs declarations and freight quotes for both INBOUND and
 * OUTBOUND directions.
 *
 * CLAUDE.md compliance:
 *   - Protected by JwtAuthGuard + TenantGuard.
 *   - Every @Body / @Query parameter is a class-validator DTO (no `any`).
 *   - Errors are returned by the service as error code + i18n key.
 */
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly service: LogisticsService) {}

  // ── Shipments ──

  @Get('shipments')
  findAllShipments(@Query() query: ShipmentQueryDto) {
    return this.service.findAllShipments(query);
  }

  @Get('shipments/:id')
  findShipment(@Param('id') id: string) {
    return this.service.findShipmentById(id);
  }

  @Post('shipments')
  createShipment(@Body() dto: CreateShipmentDto) {
    return this.service.createShipment(dto);
  }

  @Patch('shipments/:id')
  updateShipment(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.service.updateShipment(id, dto);
  }

  @Patch('shipments/:id/status')
  updateShipmentStatus(@Param('id') id: string, @Body() dto: UpdateShipmentStatusDto) {
    return this.service.updateShipmentStatus(id, dto.status);
  }

  // ── Container events ──

  @Get('shipments/:id/events')
  findContainerEvents(@Param('id') id: string) {
    return this.service.findContainerEvents(id);
  }

  @Post('shipments/:id/events')
  addContainerEvent(@Param('id') id: string, @Body() dto: AddContainerEventDto) {
    return this.service.addContainerEvent(id, dto);
  }

  @Delete('events/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeContainerEvent(@Param('id') id: string) {
    return this.service.removeContainerEvent(id);
  }

  // ── Customs declarations ──

  @Get('customs')
  findAllCustoms(@Query() query: CustomsDeclarationQueryDto) {
    return this.service.findAllCustoms(query);
  }

  @Get('customs/:id')
  findCustoms(@Param('id') id: string) {
    return this.service.findCustomsById(id);
  }

  @Post('customs')
  createCustoms(@Body() dto: CreateCustomsDeclarationDto) {
    return this.service.createCustoms(dto);
  }

  // ── Freight quotes ──

  @Get('quotes')
  findQuotes(@Query() query: FreightQuoteQueryDto) {
    return this.service.findQuotes(query);
  }

  @Post('quotes')
  createQuote(@Body() dto: CreateFreightQuoteDto) {
    return this.service.createQuote(dto);
  }

  @Patch('quotes/:id/select')
  selectQuote(@Param('id') id: string) {
    return this.service.selectQuote(id);
  }

  // ── Shipment legs (multi-leg transit) ──

  @Get('shipments/:id/legs')
  findLegs(@Param('id') id: string) {
    return this.service.findLegs(id);
  }

  @Post('shipments/:id/legs')
  addLeg(@Param('id') id: string, @Body() dto: CreateShipmentLegDto) {
    return this.service.addLeg(id, dto);
  }

  @Get('legs/:id')
  findLeg(@Param('id') id: string) {
    return this.service.findLegById(id);
  }

  @Patch('legs/:id')
  updateLeg(@Param('id') id: string, @Body() dto: UpdateShipmentLegDto) {
    return this.service.updateLeg(id, dto);
  }

  @Delete('legs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLeg(@Param('id') id: string) {
    return this.service.removeLeg(id);
  }

  // ── Carrier payment schedule ──

  @Get('legs/:id/carrier-payments')
  findCarrierPayments(@Param('id') id: string) {
    return this.service.findCarrierPayments(id);
  }

  @Post('legs/:id/carrier-payments')
  addCarrierPayment(@Param('id') id: string, @Body() dto: CreateCarrierPaymentDto) {
    return this.service.addCarrierPayment(id, dto);
  }

  @Get('carrier-payments/:id')
  findCarrierPayment(@Param('id') id: string) {
    return this.service.findCarrierPaymentById(id);
  }

  @Patch('carrier-payments/:id')
  updateCarrierPayment(@Param('id') id: string, @Body() dto: UpdateCarrierPaymentDto) {
    return this.service.updateCarrierPayment(id, dto);
  }

  @Delete('carrier-payments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCarrierPayment(@Param('id') id: string) {
    return this.service.removeCarrierPayment(id);
  }
}
