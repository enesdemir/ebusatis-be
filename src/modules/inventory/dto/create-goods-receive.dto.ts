import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * One physical roll being registered during a goods receive.
 *
 * Each roll becomes an `InventoryItem` with the corresponding
 * `PURCHASE` inventory transaction once the receive is completed.
 */
export class CreateGoodsReceiveRollDto {
  @IsString()
  @IsNotEmpty()
  barcode!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  quantity!: number;

  @IsOptional()
  @IsString()
  batchCode?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  costPrice?: number;
}

/**
 * One variant being received in a goods receive — groups all the rolls
 * under that variant together so the service can create a single
 * `GoodsReceiveLine` row plus N `InventoryItem` rows.
 */
export class CreateGoodsReceiveLineDto {
  @IsUUID()
  variantId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiveRollDto)
  rolls!: CreateGoodsReceiveRollDto[];

  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Payload for creating a goods receive.
 *
 * Stage 0.C added the vehicle / driver / responsible-user fields so the
 * international-import flow can capture the truck details required by
 * the master diagram. The XOR between `purchaseOrderId` and an inline
 * supplier is intentionally NOT enforced because both inbound and
 * unrelated supplier-direct deliveries are valid.
 */
export class CreateGoodsReceiveDto {
  @IsUUID()
  supplierId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  shipmentId?: string;

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

  @IsOptional()
  @IsDateString()
  eta?: string;

  @IsOptional()
  @IsUUID()
  receivedById?: string;

  @IsOptional()
  @IsUUID()
  shipmentResponsibleId?: string;

  // ── Misc ──

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiveLineDto)
  lines!: CreateGoodsReceiveLineDto[];
}
