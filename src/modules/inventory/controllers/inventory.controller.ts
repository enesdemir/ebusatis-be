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

@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('rolls')
  async findAll(@Query() query: PaginatedQueryDto & Record<string, any>) {
    return this.inventoryService.findAll(query);
  }

  @Get('rolls/:id')
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post('rolls')
  async createRoll(@Body() data: any, @Req() req: any) {
    return this.inventoryService.createRoll(data, req.user?.sub);
  }

  @Post('cut')
  async cutRoll(
    @Body()
    body: {
      rollId: string;
      amount: number;
      referenceId?: string;
      note?: string;
    },
    @Req() req: any,
  ) {
    return this.inventoryService.cutRoll(
      body.rollId,
      body.amount,
      body.referenceId,
      body.note,
      req.user?.sub,
    );
  }

  @Post('waste')
  async markWaste(
    @Body() body: { rollId: string; amount: number; note?: string },
    @Req() req: any,
  ) {
    return this.inventoryService.markWaste(
      body.rollId,
      body.amount,
      body.note,
      req.user?.sub,
    );
  }

  @Post('adjust')
  async adjustStock(
    @Body() body: { rollId: string; newQuantity: number; note?: string },
    @Req() req: any,
  ) {
    return this.inventoryService.adjustStock(
      body.rollId,
      body.newQuantity,
      body.note,
      req.user?.sub,
    );
  }

  @Get('movements/:rollId')
  async getMovements(@Param('rollId') rollId: string) {
    return this.inventoryService.getMovements(rollId);
  }

  @Get('summary')
  async getSummary() {
    return this.inventoryService.getSummary();
  }
}
