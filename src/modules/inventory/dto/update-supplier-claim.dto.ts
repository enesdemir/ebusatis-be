import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimStatus } from '../entities/supplier-claim.entity';

/**
 * Payload for updating an existing supplier claim.
 *
 * Status transitions to a RESOLVED_* / REJECTED / CLOSED state
 * automatically stamp `resolvedAt` in the service layer.
 */
export class UpdateSupplierClaimDto {
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  settledAmount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  photoUrls?: string[];
}
