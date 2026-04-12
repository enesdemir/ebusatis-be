import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { Shipment } from './entities/shipment.entity';
import { ShipmentLine } from './entities/shipment-line.entity';
import { ShipmentLeg } from './entities/shipment-leg.entity';
import { CarrierPaymentSchedule } from './entities/carrier-payment-schedule.entity';
import { ContainerEvent } from './entities/container-event.entity';
import { CustomsDeclaration } from './entities/customs-declaration.entity';
import { FreightQuote } from './entities/freight-quote.entity';
import { DeliveryProof } from './entities/delivery-proof.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { SalesOrderLine } from '../orders/entities/sales-order-line.entity';
import { OrderRollAllocation } from '../orders/entities/order-roll-allocation.entity';
import { Packing } from '../orders/entities/packing.entity';
import { LogisticsService } from './services/logistics.service';
import { OutboundShipmentService } from './services/outbound-shipment.service';
import { DeliveryProofService } from './services/delivery-proof.service';
import { CarrierApiService } from './services/carrier-api.service';
import { CarrierTrackingService } from './services/carrier-tracking.service';
import { LogisticsController } from './controllers/logistics.controller';
import { OutboundShipmentController } from './controllers/outbound-shipment.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Logistics module.
 *
 * Stage 0.B unified INBOUND and OUTBOUND shipments under a single
 * `Shipment` entity discriminated by `direction`. Stage 0.C added
 * multi-leg transit support and carrier-payment scheduling. Sprint 10
 * layers the outbound fulfilment pipeline on top:
 *   - `OutboundShipmentService` turns a packed SalesOrder into a
 *     Shipment + ShipmentLine fan-out;
 *   - `CarrierApiService` resolves a carrier code to a provider
 *     adapter (Aras/Yurtiçi/MNG are env-opt-in, STUB is default);
 *   - `CarrierTrackingService` runs an hourly cron that polls open
 *     shipments and flips their status on transitions;
 *   - `DeliveryProofService` captures signature + photo at customer
 *     handover and flips Shipment/SalesOrder to DELIVERED.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Shipment,
      ShipmentLine,
      ShipmentLeg,
      CarrierPaymentSchedule,
      ContainerEvent,
      CustomsDeclaration,
      FreightQuote,
      DeliveryProof,
      SalesOrder,
      SalesOrderLine,
      OrderRollAllocation,
      Packing,
    ]),
    ConfigModule,
    AuthModule,
  ],
  controllers: [LogisticsController, OutboundShipmentController],
  providers: [
    LogisticsService,
    OutboundShipmentService,
    DeliveryProofService,
    CarrierApiService,
    CarrierTrackingService,
  ],
  exports: [
    LogisticsService,
    OutboundShipmentService,
    DeliveryProofService,
    CarrierApiService,
    CarrierTrackingService,
    MikroOrmModule,
  ],
})
export class LogisticsModule {}
