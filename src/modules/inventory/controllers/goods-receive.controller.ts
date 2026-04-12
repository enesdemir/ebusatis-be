import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { GoodsReceiveService } from '../services/goods-receive.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CreateGoodsReceiveDto } from '../dto/create-goods-receive.dto';
import { GoodsReceiveQueryDto } from '../dto/goods-receive-query.dto';
import { ReportDiscrepancyDto } from '../dto/report-discrepancy.dto';

/**
 * Goods Receive controller.
 *
 * CLAUDE.md compliance:
 *   - Protected by JwtAuthGuard + TenantGuard.
 *   - Every @Body / @Query parameter is a class-validator DTO (no `any`).
 *   - Errors are returned by the service as error code + i18n key.
 */
@Controller('inventory/receiving')
@UseGuards(JwtAuthGuard, TenantGuard)
export class GoodsReceiveController {
  constructor(private readonly grService: GoodsReceiveService) {}

  @Get()
  findAll(@Query() query: GoodsReceiveQueryDto) {
    return this.grService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGoodsReceiveDto, @Req() req: any) {
    return this.grService.create(dto, req.user?.sub);
  }

  // ── Discrepancy reporting ──

  @Get('lines/:id')
  findLine(@Param('id') id: string) {
    return this.grService.findLineById(id);
  }

  @Patch('lines/:id/discrepancy')
  reportDiscrepancy(@Param('id') id: string, @Body() dto: ReportDiscrepancyDto) {
    return this.grService.reportDiscrepancy(id, dto);
  }
}
