import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import {
  CreateRollDto,
  CutRollDto,
  WasteRollDto,
  AdjustStockDto,
} from '../dto';

/**
 * Inventory controller.
 *
 * CLAUDE.md compliance:
 *   - JwtAuthGuard + TenantGuard on all endpoints.
 *   - Every @Body uses a class-validator DTO.
 */
@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('rolls')
  findAll(@Query() query: PaginatedQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('rolls/:id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post('rolls')
  createRoll(
    @Body() dto: CreateRollDto,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.inventoryService.createRoll(dto, req.user?.sub);
  }

  @Post('cut')
  cutRoll(@Body() dto: CutRollDto, @Req() req: { user?: { sub?: string } }) {
    return this.inventoryService.cutRoll(
      dto.rollId,
      dto.amount,
      dto.referenceId,
      dto.note,
      req.user?.sub,
    );
  }

  @Post('waste')
  markWaste(
    @Body() dto: WasteRollDto,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.inventoryService.markWaste(
      dto.rollId,
      dto.amount,
      dto.note,
      req.user?.sub,
    );
  }

  @Post('adjust')
  adjustStock(
    @Body() dto: AdjustStockDto,
    @Req() req: { user?: { sub?: string } },
  ) {
    return this.inventoryService.adjustStock(
      dto.rollId,
      dto.newQuantity,
      dto.note,
      req.user?.sub,
    );
  }

  @Get('movements/:rollId')
  getMovements(@Param('rollId') rollId: string) {
    return this.inventoryService.getMovements(rollId);
  }

  @Get('summary')
  getSummary() {
    return this.inventoryService.getSummary();
  }
}
