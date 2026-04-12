import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single line within a sales order.
 */
export class CreateSalesOrderLineDto {
  @IsUUID()
  @IsNotEmpty()
  variantId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  requestedQuantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discount?: number;

  @IsOptional()
  @IsUUID()
  taxRateId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
