import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { OutboundShipmentService } from '../services/outbound-shipment.service';
import { DeliveryProofService } from '../services/delivery-proof.service';
import { CarrierTrackingService } from '../services/carrier-tracking.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RecordDeliveryProofDto } from '../dto/record-delivery-proof.dto';

interface AuthedRequest extends ExpressRequest {
  user?: { sub?: string; id?: string };
}

@Controller('logistics/outbound')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OutboundShipmentController {
  constructor(
    private readonly outbound: OutboundShipmentService,
    private readonly proof: DeliveryProofService,
    private readonly tracking: CarrierTrackingService,
  ) {}

  @Post('from-sales-order/:salesOrderId')
  createFromSalesOrder(@Param('salesOrderId') salesOrderId: string) {
    return this.outbound.createFromSalesOrder(salesOrderId);
  }

  @Post('shipments/:id/delivery-proof')
  recordDelivery(
    @Param('id') id: string,
    @Body() dto: RecordDeliveryProofDto,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.proof.record(id, dto, userId);
  }

  @Get('shipments/:id/delivery-proof')
  findDelivery(@Param('id') id: string) {
    return this.proof.findByShipment(id);
  }

  @Post('shipments/:id/poll-carrier')
  pollCarrier(@Param('id') id: string) {
    return this.tracking.pollOnce(id);
  }
}
