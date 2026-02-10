
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { Role } from '../entities/role.entity';

export class CreateSystemRoleDto {
  name: string;
  permissions: string[];
}

export class UpdateSystemRoleDto {
   name: string;
   permissions: string[];
}

@Controller('system-roles')
export class SystemRolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(): Promise<Role[]> {
    return this.rolesService.findAllSystemRoles();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Role> {
     return this.rolesService.findOneSystemRole(id);
  }

  @Post()
  async create(@Body() dto: CreateSystemRoleDto): Promise<Role> {
    return this.rolesService.createSystemRole(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSystemRoleDto): Promise<Role> {
    return this.rolesService.updateSystemRole(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.rolesService.deleteSystemRole(id);
  }
}
