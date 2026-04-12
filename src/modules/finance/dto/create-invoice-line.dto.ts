import {
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single line within an invoice.
 */
export class CreateInvoiceLineDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantity!: number;

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
  sourceOrderLineId?: string;
}
