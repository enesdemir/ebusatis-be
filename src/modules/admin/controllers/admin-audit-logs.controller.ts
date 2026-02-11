import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { AuditService } from '../services/audit.service';
import { AuditAction } from '../entities/audit-log.entity';

@ApiTags('Admin - Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List platform audit logs (paginated, filterable)' })
  async findAll(
    @Query('action') action?: AuditAction,
    @Query('actorId') actorId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll({
      action,
      actorId,
      tenantId,
      dateFrom,
      dateTo,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log entry by ID' })
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
