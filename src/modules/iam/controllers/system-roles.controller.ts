import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { RolesService } from '../services/roles.service';
import { Role } from '../entities/role.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';

export class CreateSystemRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class UpdateSystemRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

@ApiTags('IAM - System Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('system-roles')
export class SystemRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all system role templates' })
  async findAll(): Promise<Role[]> {
    return this.rolesService.findAllSystemRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a system role by ID' })
  async findOne(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findOneSystemRole(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new system role template' })
  async create(@Body() dto: CreateSystemRoleDto): Promise<Role> {
    return this.rolesService.createSystemRole(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a system role template' })
  async update(@Param('id') id: string, @Body() dto: UpdateSystemRoleDto): Promise<Role> {
    return this.rolesService.updateSystemRole(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a system role template' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.rolesService.deleteSystemRole(id);
  }
}
