import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    sub?: string;
    id?: string;
    [key: string]: unknown;
  };
}
import { SupplierClaimService } from '../services/supplier-claim.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { OpenSupplierClaimDto } from '../dto/open-supplier-claim.dto';
import { UpdateSupplierClaimDto } from '../dto/update-supplier-claim.dto';
import { SupplierClaimQueryDto } from '../dto/supplier-claim-query.dto';

/**
 * Supplier Claim controller.
 *
 * Exposes the workflow for opening and resolving claims raised against
 * goods receive discrepancies.
 *
 * CLAUDE.md compliance:
 *   - Protected by JwtAuthGuard + TenantGuard.
 *   - Every @Body / @Query parameter is a class-validator DTO.
 *   - Errors come back as error code + i18n key from the service.
 */
@Controller('inventory/supplier-claims')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SupplierClaimController {
  constructor(private readonly service: SupplierClaimService) {}

  @Get()
  findAll(@Query() query: SupplierClaimQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  open(@Body() dto: OpenSupplierClaimDto, @Req() req: AuthenticatedRequest) {
    return this.service.open(dto, req.user?.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierClaimDto) {
    return this.service.update(id, dto);
  }
}
