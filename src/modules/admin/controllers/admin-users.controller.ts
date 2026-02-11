import { Controller, Get, Param, Query, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { AdminUsersService } from '../services/admin-users.service';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all platform users (cross-tenant, paginated)' })
  async findAll(
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('isTenantOwner') isTenantOwner?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminUsersService.findAll({
      search,
      tenantId,
      isTenantOwner: isTenantOwner !== undefined ? isTenantOwner === 'true' : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user detail by ID (cross-tenant)' })
  async findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate a user' })
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminUsersService.updateStatus(id, isActive);
  }
}
