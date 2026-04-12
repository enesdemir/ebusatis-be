import { IsEnum } from 'class-validator';
import { ShipmentStatus } from '../entities/shipment.entity';

/**
 * Payload for transitioning a shipment to a new status.
 *
 * Some transitions trigger automatic date stamping in the service:
 *  - IN_TRANSIT → sets `actualDeparture` if missing.
 *  - DELIVERED  → sets `actualArrival` if missing.
 */
export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;
}
