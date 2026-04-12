import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
  IsString,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValuationMethod } from '../entities/stock-valuation.entity';

/**
 * Payload for creating a stock valuation snapshot.
 */
export class CreateStockValuationDto {
  @IsDateString()
  periodDate!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsEnum(ValuationMethod)
  method?: ValuationMethod;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  layers?: Array<{
    date: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;

  @IsOptional()
  @IsString()
  note?: string;
}
