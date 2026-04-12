import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateShipmentLegDto } from './create-shipment-leg.dto';

/**
 * Payload for updating a shipment leg.
 *
 * `legNumber` and `legType` are kept immutable after creation; if a
 * different ordering or type is needed the leg should be deleted and
 * recreated to keep audit trails clean.
 */
export class UpdateShipmentLegDto extends PartialType(
  OmitType(CreateShipmentLegDto, ['legNumber', 'legType'] as const),
) {}
