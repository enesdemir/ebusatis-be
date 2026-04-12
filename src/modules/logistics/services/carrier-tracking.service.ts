import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  Shipment,
  ShipmentStatus,
  ShipmentDirection,
} from '../entities/shipment.entity';
import { CarrierApiService } from './carrier-api.service';

/**
 * CarrierTrackingService (Sprint 10).
 *
 * Hourly cron that polls every OUTBOUND shipment in a non-terminal
 * state, asks the carrier adapter for its latest status and persists
 * the transition. Manual invocation (`pollOnce`) is used by tests and
 * the dev-only controller endpoint.
 */
@Injectable()
export class CarrierTrackingService {
  private readonly logger = new Logger(CarrierTrackingService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly carrier: CarrierApiService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async pollOpenShipments(): Promise<number> {
    const shipments = await this.em.find(
      Shipment,
      {
        direction: ShipmentDirection.OUTBOUND,
        status: {
          $in: [
            ShipmentStatus.CONFIRMED,
            ShipmentStatus.PREPARING,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.OUT_FOR_DELIVERY,
          ],
        },
        carrierTrackingNumber: { $ne: null },
      },
      { populate: ['carrier'] as never[], filters: false },
    );

    let updated = 0;
    for (const shipment of shipments) {
      try {
        const carrierCode = (
          shipment.carrier as unknown as { code?: string } | undefined
        )?.code;
        if (!shipment.carrierTrackingNumber) continue;
        const status = await this.carrier.getStatus(
          shipment.carrierTrackingNumber,
          carrierCode,
        );
        if (status.status !== shipment.status) {
          shipment.status = status.status;
          if (status.status === ShipmentStatus.DELIVERED) {
            shipment.actualArrival = status.lastUpdate ?? new Date();
          }
          updated += 1;
        }
      } catch (err) {
        this.logger.error(
          `carrier status poll failed shipment=${shipment.id}: ${(err as Error).message}`,
        );
      }
    }

    if (updated > 0) {
      await this.em.flush();
      this.logger.log(`polled ${shipments.length}, updated ${updated}`);
    }
    return updated;
  }

  async pollOnce(shipmentId: string): Promise<Shipment> {
    const shipment = await this.em.findOneOrFail(
      Shipment,
      { id: shipmentId },
      { populate: ['carrier'] as never[] },
    );
    if (!shipment.carrierTrackingNumber) return shipment;
    const carrierCode = (
      shipment.carrier as unknown as { code?: string } | undefined
    )?.code;
    const status = await this.carrier.getStatus(
      shipment.carrierTrackingNumber,
      carrierCode,
    );
    shipment.status = status.status;
    if (status.status === ShipmentStatus.DELIVERED) {
      shipment.actualArrival = status.lastUpdate ?? new Date();
    }
    await this.em.flush();
    return shipment;
  }
}
