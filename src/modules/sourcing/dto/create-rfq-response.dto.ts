import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRfqResponseItemDto } from './create-rfq-response-item.dto';

/**
 * Payload for submitting a supplier response to an RFQ.
 */
export class CreateRfqResponseDto {
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRfqResponseItemDto)
  lineItems?: CreateRfqResponseItemDto[];
}
