import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentLegType } from '../entities/shipment-leg.entity';

/**
 * Payload for adding a leg to a multi-leg shipment.
 *
 * Legs are ordered by `legNumber` (1, 2, 3, ...). Either provide one
 * explicitly or let the service auto-assign by counting existing legs
 * on the parent shipment.
 */
export class CreateShipmentLegDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  legNumber?: number;

  @IsEnum(ShipmentLegType)
  legType!: ShipmentLegType;

  @IsOptional()
  @IsString()
  originLocation?: string;

  @IsOptional()
  @IsString()
  destinationLocation?: string;

  @IsOptional()
  @IsUUID()
  intermediateWarehouseId?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeparture?: string;

  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @IsOptional()
  @IsDateString()
  actualDeparture?: string;

  @IsOptional()
  @IsDateString()
  actualArrival?: string;

  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  freightCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  storageCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  otherCosts?: number;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
