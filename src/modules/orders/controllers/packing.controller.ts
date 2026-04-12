import {
  Controller,
  UseGuards,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PackingService } from '../services/packing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { CreatePackingBoxDto } from '../dto';

interface AuthedRequest extends ExpressRequest {
  user?: { sub?: string; id?: string };
}

@Controller('orders/packings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PackingController {
  constructor(private readonly service: PackingService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('by-picking/:pickingId')
  findByPicking(@Param('pickingId') pickingId: string) {
    return this.service.findByPicking(pickingId);
  }

  @Post('by-picking/:pickingId/start')
  start(@Param('pickingId') pickingId: string, @Req() req: AuthedRequest) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.service.startPacking(pickingId, userId);
  }

  @Post(':id/boxes')
  createBox(@Param('id') id: string, @Body() dto: CreatePackingBoxDto) {
    return this.service.createBox(
      id,
      dto.pickingLineIds,
      dto.weightKg,
      dto.dimensionsCm,
    );
  }

  @Delete('boxes/:boxId')
  removeBox(@Param('boxId') boxId: string) {
    return this.service.removeBox(boxId);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.service.completePacking(id);
  }
}
