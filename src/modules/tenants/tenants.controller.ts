import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { SubscriptionStatus } from './entities/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthService } from '../auth/auth.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly authService: AuthService,
  ) {}

  @Post(':id/impersonate')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Login as the tenant owner (Impersonation)' })
  async impersonate(@Param('id') id: string) {
    const tenant = await this.tenantsService.findOne(id);
    if (!tenant.users || tenant.users.length === 0) {
      throw new NotFoundException('No users found in this tenant to impersonate.');
    }
    const targetUser = tenant.users[0];
    return this.authService.impersonate(targetUser.id);
  }

  @Post()
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Create a new tenant (System Admin only)' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'List all tenants (paginated, searchable)' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: SubscriptionStatus,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tenantsService.findAll({
      search,
      status,
      type,
      sortBy,
      sortOrder,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/statistics')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Get tenant statistics (user count, last login, etc.)' })
  getStatistics(@Param('id') id: string) {
    return this.tenantsService.getStatistics(id);
  }

  @Patch(':id')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Update a tenant' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/subscription')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Update tenant subscription status (Activate/Suspend/Trial)' })
  updateSubscription(
    @Param('id') id: string,
    @Body('subscriptionStatus') subscriptionStatus: SubscriptionStatus,
  ) {
    return this.tenantsService.updateSubscription(id, subscriptionStatus);
  }

  @Patch(':id/features')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Toggle tenant feature flags (modules on/off)' })
  updateFeatures(
    @Param('id') id: string,
    @Body('features') features: Record<string, boolean>,
  ) {
    return this.tenantsService.updateFeatures(id, features);
  }

  @Delete(':id')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Delete (Soft) a tenant' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
