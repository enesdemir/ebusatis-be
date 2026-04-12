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
 * A single item within an RFQ (Request for Quotation).
 */
export class CreateRfqItemDto {
  @IsUUID()
  @IsNotEmpty()
  variantId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
