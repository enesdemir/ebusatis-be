import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { SupplierPortalTokenAdminService } from '../services/supplier-portal-token-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

class IssueTokenDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

/**
 * Admin endpoint for issuing supplier portal tokens.
 * Tenant admins call this when onboarding a supplier or rotating a
 * compromised link.
 */
@Controller('admin/supplier-portal')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SupplierPortalAdminController {
  constructor(
    private readonly adminService: SupplierPortalTokenAdminService,
    private readonly config: ConfigService,
  ) {}

  @Post('tokens/:partnerId')
  issue(@Param('partnerId') partnerId: string, @Body() dto: IssueTokenDto) {
    const publicBaseUrl =
      this.config.get<string>('PUBLIC_FRONTEND_URL') ?? 'http://localhost:5173';
    return this.adminService.issueForPartner(
      partnerId,
      publicBaseUrl,
      dto.days,
    );
  }
}
