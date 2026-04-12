import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WarehouseLocationService } from '../services/warehouse-location.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { LocationType } from '../entities/warehouse-location.entity';

@Controller('definitions/warehouse-locations')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WarehouseLocationController {
  constructor(private readonly service: WarehouseLocationService) {}

  @Get()
  list(@Query('warehouseId') warehouseId?: string) {
    return this.service.list(warehouseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/occupancy')
  occupancy(@Param('id') id: string) {
    return this.service.occupancy(id);
  }

  @Post()
  create(
    @Body()
    data: {
      warehouseId: string;
      code: string;
      name: string;
      type: LocationType;
      parentId?: string;
      capacity?: Record<string, number>;
      sortOrder?: number;
    },
  ) {
    return this.service.create(data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      code: string;
      name: string;
      capacity: Record<string, number>;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    return this.service.update(id, data);
  }

  @Post('transfer/:itemId/:locationId')
  transfer(
    @Param('itemId') itemId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.service.transferItem(itemId, locationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
