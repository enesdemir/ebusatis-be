import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { TenantContextMissingException } from '../../../common/errors/app.exceptions';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@Request() req) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.rolesService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.rolesService.findOne(id, tenantId);
  }

  @Post()
  async create(@Request() req, @Body() createRoleDto: CreateRoleDto) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.rolesService.create(tenantId, createRoleDto);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.rolesService.update(id, tenantId, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.rolesService.remove(id, tenantId);
  }
}
