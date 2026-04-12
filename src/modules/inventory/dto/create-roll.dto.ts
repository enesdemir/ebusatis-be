import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for creating an inventory roll (InventoryItem).
 */
export class CreateRollDto {
  @IsUUID()
  variantId!: string;

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

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  costPrice?: number;

  @IsOptional()
  @IsUUID()
  receivedFromId?: string;

  @IsOptional()
  @IsUUID()
  goodsReceiveId?: string;
}
