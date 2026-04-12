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
import { SupplierPortalService } from '../services/supplier-portal.service';
import { SupplierTokenGuard } from '../../auth/guards/supplier-token.guard';
import { MilestoneStatus } from '../../production/entities/production-milestone.entity';
import { MediaType } from '../../production/entities/production-media.entity';

interface SupplierRequest extends ExpressRequest {
  supplier?: { partnerId: string; tenantId: string };
}

/**
 * Public, token-protected supplier portal endpoints (Sprint 11).
 *
 * Token is carried either in the `:token` URL param or the
 * `x-supplier-token` header. SupplierTokenGuard decodes it and stamps
 * `req.supplier` with the scope; every method passes that scope to
 * the service so data never crosses partner boundaries.
 */
@Controller('supplier')
@UseGuards(SupplierTokenGuard)
export class SupplierPortalController {
  constructor(private readonly service: SupplierPortalService) {}

  @Get('po/:token')
  listPurchaseOrders(@Req() req: SupplierRequest) {
    return this.service.listPurchaseOrders(req.supplier!);
  }

  @Get('spo/:id/:token')
  getSpo(@Req() req: SupplierRequest, @Param('id') id: string) {
    return this.service.getProductionOrder(req.supplier!, id);
  }

  @Patch('milestone/:id/:token')
  updateMilestone(
    @Req() req: SupplierRequest,
    @Param('id') id: string,
    @Body()
    data: {
      status?: MilestoneStatus;
      note?: string;
      supplierMediaUrls?: string[];
    },
  ) {
    return this.service.updateMilestone(req.supplier!, id, data);
  }

  @Post('media/:spoId/:token')
  uploadMedia(
    @Req() req: SupplierRequest,
    @Param('spoId') spoId: string,
    @Body()
    data: {
      fileUrl: string;
      fileName: string;
      type: MediaType;
      milestoneCode?: string;
      description?: string;
    },
  ) {
    return this.service.uploadMedia(
      req.supplier!,
      spoId,
      data.fileUrl,
      data.fileName,
      data.type,
      data.milestoneCode,
      data.description,
    );
  }

  @Get('rfqs/:token')
  listOpenRfqs(@Req() req: SupplierRequest) {
    return this.service.listOpenRfqs(req.supplier!);
  }

  @Post('quote/:rfqId/:token')
  submitQuote(
    @Req() req: SupplierRequest,
    @Param('rfqId') rfqId: string,
    @Body()
    data: {
      totalPrice: number;
      currency?: string;
      leadTimeDays?: number;
      validUntil?: string;
      lineItems?: Array<{
        variantId: string;
        unitPrice: number;
        moq?: number;
        note?: string;
      }>;
      note?: string;
    },
  ) {
    return this.service.submitQuote(req.supplier!, rfqId, {
      ...data,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    });
  }
}
