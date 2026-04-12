import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AttributesService } from '../services/attributes.service';
import { CreateAttributeDto, UpdateAttributeDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

/**
 * Attributes (EAV) controller.
 *
 * CLAUDE.md compliance:
 *   - JwtAuthGuard + TenantGuard on all endpoints.
 *   - DTOs already existed; guard was missing (fixed in stage 3).
 */
@Controller('attributes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Post()
  create(@Body() dto: CreateAttributeDto) {
    return this.attributesService.create(dto);
  }

  @Get()
  findAll() {
    return this.attributesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attributesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.attributesService.remove(id);
  }
}
