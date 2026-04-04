import { Controller, UseGuards, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { GoodsReceiveService } from '../services/goods-receive.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

@Controller('inventory/receiving')
@UseGuards(JwtAuthGuard, TenantGuard)
export class GoodsReceiveController {
  constructor(private readonly grService: GoodsReceiveService) {}

  @Get()
  async findAll(@Query() query: PaginatedQueryDto) {
    return this.grService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.grService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.grService.create(data, req.user?.sub);
  }
}
