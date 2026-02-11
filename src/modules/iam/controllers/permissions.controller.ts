import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from '../services/permissions.service';
import { Permission } from '../entities/permission.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';

@ApiTags('IAM - Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all permissions, optionally filtered by scope' })
  async findAll(@Query('scope') scope?: string): Promise<Permission[]> {
    return this.permissionsService.findAll(scope);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all unique permission categories' })
  async findCategories(): Promise<string[]> {
    return this.permissionsService.findCategories();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new permission definition' })
  async create(
    @Body() body: { slug: string; category: string; assignableScope?: string; description?: string },
  ): Promise<Permission> {
    return this.permissionsService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a permission definition' })
  async update(
    @Param('id') id: string,
    @Body() body: { category?: string; assignableScope?: string; description?: string },
  ): Promise<Permission> {
    return this.permissionsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permission definition' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.permissionsService.remove(id);
  }
}
