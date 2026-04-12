import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrackingStrategy } from '../entities/product.entity';

/**
 * Payload for creating a product.
 */
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  taxRateId?: string;

  @IsOptional()
  @IsEnum(TrackingStrategy)
  trackingStrategy?: TrackingStrategy;

  @IsOptional()
  @IsString()
  fabricComposition?: string;

  @IsOptional()
  @IsString()
  washingInstructions?: string;

  @IsOptional()
  @IsString()
  collectionName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  moq?: number;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
