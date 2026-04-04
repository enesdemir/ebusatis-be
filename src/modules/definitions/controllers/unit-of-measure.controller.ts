import { Controller, UseGuards, Post, Patch, Body, Param } from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';
import { CreateUnitDto, UpdateUnitDto } from '../dto/create-unit.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/units')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UnitOfMeasureController extends BaseDefinitionController<UnitOfMeasure> {
  constructor(private readonly unitService: UnitOfMeasureService) {
    super(unitService);
  }

  @Post()
  async create(@Body() dto: CreateUnitDto) {
    return this.unitService.create(dto as any);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitService.update(id, dto as any);
  }
}
