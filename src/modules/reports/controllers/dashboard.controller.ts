import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('reports/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('groups/:group')
  getKpis(@Param('group') group: string) {
    return this.service.getKpisForGroup(group);
  }

  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: string) {
    return this.service.getRecentActivity(limit ? Number(limit) : 20);
  }
}
