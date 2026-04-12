import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LandedCostService } from '../services/landed-cost.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CalculateLandedCostDto, LandedCostQueryDto } from '../dto';

/**
 * Landed Cost controller.
 *
 * Exposes the landed cost calculator that aggregates product cost,
 * freight, customs and storage costs for a purchase order and
 * (optionally) its associated shipment.
 *
 * CLAUDE.md compliance:
 *   - Protected by JwtAuthGuard + TenantGuard.
 *   - Every @Body / @Query parameter is a class-validator DTO (no `any`).
 *   - Errors are returned as error code + i18n key by the service.
 */
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('accounting/landed-costs')
export class LandedCostController {
  constructor(private readonly service: LandedCostService) {}

  @Get()
  findAll(@Query() query: LandedCostQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post('calculate')
  calculate(@Body() dto: CalculateLandedCostDto) {
    return this.service.calculate(dto);
  }
}
