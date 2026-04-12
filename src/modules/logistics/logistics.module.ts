import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Shipment } from './entities/shipment.entity';
import { ShipmentLine } from './entities/shipment-line.entity';
import { ShipmentLeg } from './entities/shipment-leg.entity';
import { CarrierPaymentSchedule } from './entities/carrier-payment-schedule.entity';
import { ContainerEvent } from './entities/container-event.entity';
import { CustomsDeclaration } from './entities/customs-declaration.entity';
import { FreightQuote } from './entities/freight-quote.entity';
import { LogisticsService } from './services/logistics.service';
import { LogisticsController } from './controllers/logistics.controller';

/**
 * Logistics module.
 *
 * Stage 0.B unified the previously split shipment models — the
 * inbound `ShipmentPlan` (logistics) and the outbound `Shipment`
 * (finance) — under a single `Shipment` entity discriminated by
 * `direction`. This module is now the single owner of every shipment,
 * its line items, container timeline, customs declarations and
 * freight quotes.
 *
 * Stage 0.C added multi-leg transit support via `ShipmentLeg` and
 * carrier payment scheduling via `CarrierPaymentSchedule`.
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
    ]),
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService, MikroOrmModule],
})
export class LogisticsModule {}
