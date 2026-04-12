import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateShipmentDto } from './create-shipment.dto';

/**
 * Payload for updating a shipment.
 *
 * Direction and the parent order linkage are immutable once set, so
 * they are removed from the partial type. Status changes go through
 * the dedicated `updateStatus` endpoint with `UpdateShipmentStatusDto`.
 */
export class UpdateShipmentDto extends PartialType(
  OmitType(CreateShipmentDto, [
    'direction',
    'purchaseOrderId',
    'salesOrderId',
  ] as const),
) {}
