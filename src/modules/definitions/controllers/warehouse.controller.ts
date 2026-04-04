import { Controller, UseGuards } from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { Warehouse } from '../entities/warehouse.entity';
import { WarehouseService } from '../services/warehouse.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/warehouses')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WarehouseController extends BaseDefinitionController<Warehouse> {
  constructor(private readonly warehouseService: WarehouseService) {
    super(warehouseService);
  }
}
