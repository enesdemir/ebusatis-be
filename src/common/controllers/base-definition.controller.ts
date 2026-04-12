import {
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BaseDefinitionEntity } from '../entities/base-definition.entity';
import { BaseDefinitionService } from '../services/base-definition.service';
import { PaginatedQueryDto } from '../dto/paginated-query.dto';

/**
 * Generic CRUD controller for definition entities.
 * Extend this class and add @Controller(), @UseGuards() decorators.
 *
 * Kullanım:
 *   @Controller('definitions/units')
 *   @UseGuards(JwtAuthGuard, TenantGuard)
 *   export class UnitOfMeasureController extends BaseDefinitionController<UnitOfMeasure> {
 *     constructor(service: UnitOfMeasureService) {
 *       super(service);
 *     }
 *   }
 */
export abstract class BaseDefinitionController<T extends BaseDefinitionEntity> {
  constructor(protected readonly service: BaseDefinitionService<T>) {}

  @Get()
  async findAll(@Query() query: PaginatedQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<T>) {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Partial<T>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }

  @Patch('bulk/reorder')
  async reorder(@Body() items: Array<{ id: string; sortOrder: number }>) {
    return this.service.reorder(items);
  }
}
