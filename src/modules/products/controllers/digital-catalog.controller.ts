import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { DigitalCatalogService } from '../services/digital-catalog.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

interface AuthedRequest extends ExpressRequest {
  user?: { sub?: string; id?: string };
}

@Controller('pim/catalogs')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DigitalCatalogController {
  constructor(private readonly service: DigitalCatalogService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(
    @Body()
    data: {
      title: string;
      variantIds: string[];
      showPrices?: boolean;
      showStock?: boolean;
      expiresAt?: string;
      partnerId?: string;
    },
    @Req() req: AuthedRequest,
  ) {
    const userId = (req.user?.sub ?? req.user?.id) as string;
    return this.service.create(data, userId);
  }

  @Post(':id/variants')
  addVariants(@Param('id') id: string, @Body() body: { variantIds: string[] }) {
    return this.service.addVariants(id, body.variantIds);
  }

  @Patch(':id/rotate-token')
  rotate(@Param('id') id: string) {
    return this.service.rotateToken(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
