import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide KPI statistics' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-tenants')
  @ApiOperation({ summary: 'Recently created tenants' })
  async getRecentTenants(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentTenants(limit ?? 10);
  }

  @Get('activity-feed')
  @ApiOperation({ summary: 'Platform activity log feed' })
  async getActivityFeed(@Query('limit') limit?: number) {
    return this.dashboardService.getActivityFeed(limit ?? 20);
  }
}
