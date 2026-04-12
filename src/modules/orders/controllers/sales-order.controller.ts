import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SalesOrderService } from '../services/sales-order.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

@Controller('orders/sales')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SalesOrderController {
  constructor(private readonly service: SalesOrderService) {}

  @Get()
  async findAll(@Query() query: PaginatedQueryDto & { partnerId?: string }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.service.create(data, req.user?.sub);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('lines/:lineId/allocate')
  async allocateRoll(
    @Param('lineId') lineId: string,
    @Body() body: { rollId: string; quantity: number },
  ) {
    return this.service.allocateRoll(lineId, body.rollId, body.quantity);
  }
}
