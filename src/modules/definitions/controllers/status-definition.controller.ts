import { Controller, UseGuards } from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { StatusDefinition } from '../entities/status-definition.entity';
import { StatusDefinitionService } from '../services/status-definition.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/statuses')
@UseGuards(JwtAuthGuard, TenantGuard)
export class StatusDefinitionController extends BaseDefinitionController<StatusDefinition> {
  constructor(private readonly statusService: StatusDefinitionService) {
    super(statusService);
  }
}
