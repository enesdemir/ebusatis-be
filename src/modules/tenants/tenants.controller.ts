import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
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
    // Assume the first user is the owner or main admin
    // In a real scenario, we might query for isTenantOwner=true
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
  @RequirePermissions('tenants.manage') // Or tenants.view
  @ApiOperation({ summary: 'List all tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Update a tenant' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @RequirePermissions('tenants.manage')
  @ApiOperation({ summary: 'Delete (Soft) a tenant' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
