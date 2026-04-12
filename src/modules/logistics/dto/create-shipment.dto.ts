import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import {
  ShipmentDirection,
  ShipmentStatus,
  Incoterm,
} from '../entities/shipment.entity';

/**
 * Payload for creating a shipment.
 *
 * One of `purchaseOrderId` (INBOUND) or `salesOrderId` (OUTBOUND) is
 * required — the service layer enforces the XOR using the
 * `ShipmentOrderReferenceRequiredException`. This is intentionally not
 * encoded as a column-level constraint to keep the schema flexible for
 * future shipment types (e.g. inter-warehouse transfer).
 */
export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  shipmentNumber!: string;

  @IsEnum(ShipmentDirection)
  direction!: ShipmentDirection;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  // ── Order linkage (XOR by direction) ──

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  // ── Origin / destination ──

  @IsOptional()
  @IsUUID()
  originWarehouseId?: string;

  @IsOptional()
  @IsUUID()
  destinationWarehouseId?: string;

  @IsOptional()
  @IsString()
  originAddress?: string;

  @IsOptional()
  @IsString()
  destinationAddress?: string;

  // ── Carrier and tracking ──

  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsUUID()
  deliveryMethodId?: string;

  @IsOptional()
  @IsString()
  carrierTrackingNumber?: string;

  @IsOptional()
  @IsString()
  carrierTrackingUrl?: string;

  // ── Container / vessel ──

  @IsOptional()
  @IsString()
  containerNumber?: string;

  @IsOptional()
  @IsString()
  containerType?: string;

  @IsOptional()
  @IsString()
  sealNumber?: string;

  @IsOptional()
  @IsString()
  vessel?: string;

  @IsOptional()
  @IsString()
  voyageNumber?: string;

  @IsOptional()
  @IsEnum(Incoterm)
  incoterm?: Incoterm;

  // ── Vehicle / driver ──

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  driverIdNumber?: string;

  // ── Dates ──

  @IsOptional()
  @IsDateString()
  estimatedDeparture?: string;

  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  // ── Cost summary ──

  @IsOptional()
  @IsUUID()
  costCurrencyId?: string;

  // ── Misc ──

  @IsOptional()
  @IsString()
  notes?: string;
}
