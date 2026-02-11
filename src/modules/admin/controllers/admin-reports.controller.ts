import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { AdminReportsService } from '../services/admin-reports.service';

@ApiTags('Admin - Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Tenant statistics overview' })
  async getTenantStats() {
    return this.reportsService.getTenantStats();
  }

  @Get('health')
  @ApiOperation({ summary: 'System health metrics' })
  async getSystemHealth() {
    return this.reportsService.getSystemHealth();
  }

  @Get('usage')
  @ApiOperation({ summary: 'Platform usage metrics' })
  async getUsageStats(@Query('days') days?: number) {
    return this.reportsService.getUsageStats(days ? Number(days) : 30);
  }
}
