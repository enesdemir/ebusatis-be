import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { MediaType } from '../entities/production-media.entity';

/**
 * Payload for attaching a media item to a supplier production order.
 *
 * Both internal users and the supplier portal use this DTO; the
 * `uploadedBySupplier` flag tells them apart.
 */
export class AddProductionMediaDto {
  @IsUUID()
  productionOrderId!: string;

  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  milestoneCode?: string;

  @IsOptional()
  @IsBoolean()
  uploadedBySupplier?: boolean;
}
