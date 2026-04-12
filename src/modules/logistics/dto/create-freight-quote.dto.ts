import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for adding a freight quote to a shipment.
 *
 * Multiple quotes can coexist for a single shipment so the team can
 * compare carrier options. The selected quote is marked separately
 * via the `selectQuote` endpoint to keep at most one selected per
 * shipment at any time.
 */
export class CreateFreightQuoteDto {
  @IsOptional()
  @IsUUID()
  shipmentId?: string;

  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsString()
  route?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  transitDays?: number;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
