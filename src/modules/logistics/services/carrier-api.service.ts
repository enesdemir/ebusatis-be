import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';

/**
 * Result envelope returned by a provider adapter when we hand a
 * shipment off to the carrier.
 */
export interface CarrierCreateResult {
  trackingNumber: string;
  trackingUrl?: string;
  providerReference?: string;
}

/**
 * Status snapshot returned by a provider adapter during polling.
 */
export interface CarrierStatusResult {
  trackingNumber: string;
  status: ShipmentStatus;
  rawStatus?: string;
  lastUpdate?: Date;
  checkpoints?: Array<{
    at: Date;
    location?: string;
    description?: string;
  }>;
}

/**
 * Minimum contract every concrete carrier adapter must implement.
 * Additional providers (Aras, Yurtiçi, MNG, international) plug in
 * by registering their implementation under their code.
 */
export interface CarrierProvider {
  code: string;
  createShipment(shipment: Shipment): Promise<CarrierCreateResult>;
  getStatus(trackingNumber: string): Promise<CarrierStatusResult>;
}

/**
 * StubProvider — used when no real carrier credentials are configured.
 *
 * Generates a deterministic tracking number and cycles the status on
 * each poll so the cron job has visible output in dev environments.
 */
class StubProvider implements CarrierProvider {
  code = 'STUB';
  private readonly cycle = new Map<string, ShipmentStatus>();

  async createShipment(shipment: Shipment): Promise<CarrierCreateResult> {
    const tracking = `STUB-${shipment.shipmentNumber}-${Date.now().toString(36).toUpperCase()}`;
    return {
      trackingNumber: tracking,
      trackingUrl: `http://localhost:5173/track/shipment/${shipment.id}`,
      providerReference: `stub-${shipment.id}`,
    };
  }

  async getStatus(trackingNumber: string): Promise<CarrierStatusResult> {
    const current = this.cycle.get(trackingNumber) ?? ShipmentStatus.IN_TRANSIT;
    const next = this.progress(current);
    this.cycle.set(trackingNumber, next);
    return {
      trackingNumber,
      status: next,
      rawStatus: next,
      lastUpdate: new Date(),
      checkpoints: [
        {
          at: new Date(),
          location: 'stub-provider',
          description: `status transitioned to ${next}`,
        },
      ],
    };
  }

  private progress(s: ShipmentStatus): ShipmentStatus {
    const ladder: ShipmentStatus[] = [
      ShipmentStatus.CONFIRMED,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ];
    const i = ladder.indexOf(s);
    if (i === -1) return ShipmentStatus.IN_TRANSIT;
    return ladder[Math.min(i + 1, ladder.length - 1)];
  }
}

/**
 * CarrierApiService (Sprint 10).
 *
 * Resolves a Shipment's `carrier` Partner to a provider adapter and
 * delegates to it. Real integrations (Aras/Yurtiçi/MNG) plug in by
 * registering implementations under their codes; a `StubProvider`
 * keeps dev + CI behaviour deterministic.
 *
 * The adapter is selected from `carrier.code` when available, else
 * falls back to STUB so the flow never crashes in a fresh install.
 */
@Injectable()
export class CarrierApiService {
  private readonly logger = new Logger(CarrierApiService.name);
  private readonly providers = new Map<string, CarrierProvider>();

  constructor(private readonly config: ConfigService) {
    this.register(new StubProvider());
  }

  register(provider: CarrierProvider): void {
    this.providers.set(provider.code.toUpperCase(), provider);
  }

  resolveProvider(carrierCode?: string): CarrierProvider {
    if (!carrierCode) return this.providers.get('STUB') as CarrierProvider;
    return (
      this.providers.get(carrierCode.toUpperCase()) ??
      (this.providers.get('STUB') as CarrierProvider)
    );
  }

  async createShipment(shipment: Shipment): Promise<CarrierCreateResult> {
    const carrierCode = (
      shipment.carrier as unknown as { code?: string } | undefined
    )?.code;
    const provider = this.resolveProvider(carrierCode);
    this.logger.log(
      `carrier.createShipment shipment=${shipment.shipmentNumber} provider=${provider.code}`,
    );
    return provider.createShipment(shipment);
  }

  async getStatus(
    trackingNumber: string,
    carrierCode?: string,
  ): Promise<CarrierStatusResult> {
    const provider = this.resolveProvider(carrierCode);
    return provider.getStatus(trackingNumber);
  }
}
