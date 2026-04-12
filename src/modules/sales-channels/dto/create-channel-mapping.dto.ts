import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SyncStatus } from '../entities/channel-product-mapping.entity';

/**
 * Payload for creating a product-to-channel mapping.
 */
export class CreateChannelMappingDto {
  @IsUUID()
  @IsNotEmpty()
  channelId!: string;

  @IsUUID()
  @IsNotEmpty()
  variantId!: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  externalSku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  channelPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  syncedQuantity?: number;

  @IsOptional()
  @IsEnum(SyncStatus)
  syncStatus?: SyncStatus;
}
