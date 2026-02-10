
import { Controller, Get, Query } from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { Permission } from '../entities/permission.entity';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll(@Query('scope') scope?: string): Promise<Permission[]> {
    return this.permissionsService.findAll(scope);
  }
}
