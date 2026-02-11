
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@Request() req) {
    // Assuming req.user exists and has tenantId
    // For development without Auth guard, hardcoding or extracting from header might be needed?
    // User context says "Standard NestJS".
    // I will assume req.user is populated by a global guard or similar.
    // If not, I might need to add AuthGuard.
    const tenantId = req.user?.tenantId; 
    if(!tenantId) throw new Error("Tenant context missing");

    return this.rolesService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId; 
    if(!tenantId) throw new Error("Tenant context missing");

    return this.rolesService.findOne(id, tenantId);
  }

  @Post()
  async create(@Request() req, @Body() createRoleDto: { name: string; permissions: string[] }) {
    const tenantId = req.user?.tenantId;
    if(!tenantId) throw new Error("Tenant context missing");

    return this.rolesService.create(tenantId, createRoleDto);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateRoleDto: { name: string; permissions: string[] },
  ) {
    const tenantId = req.user?.tenantId;
    if(!tenantId) throw new Error("Tenant context missing");

    return this.rolesService.update(id, tenantId, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if(!tenantId) throw new Error("Tenant context missing");

    return this.rolesService.remove(id, tenantId);
  }
}
