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
 * A single line item within an RFQ response.
 */
export class CreateRfqResponseItemDto {
  @IsUUID()
  @IsNotEmpty()
  variantId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  moq?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
