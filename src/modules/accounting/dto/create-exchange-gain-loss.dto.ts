import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for recording an exchange gain/loss.
 */
export class CreateExchangeGainLossDto {
  @IsString()
  @IsNotEmpty()
  fromCurrency!: string;

  @IsString()
  @IsNotEmpty()
  toCurrency!: string;

  @IsDateString()
  transactionDate!: string;

  @IsOptional()
  @IsDateString()
  settlementDate?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  originalRate!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  settlementRate?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
