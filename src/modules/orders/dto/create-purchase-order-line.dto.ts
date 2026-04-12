import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single line within a purchase order.
 */
export class CreatePurchaseOrderLineDto {
  @IsUUID()
  @IsNotEmpty()
  variantId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsUUID()
  taxRateId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
